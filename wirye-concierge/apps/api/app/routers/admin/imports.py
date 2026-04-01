import hashlib
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import require_admin
from app.db.session import get_db
from app.models.import_job import ImportJob, JobRun
from app.services.audit_service import write_audit
from app.services.import_validation_service import build_import_report
from app.tasks.import_dataset import run_import

router = APIRouter(prefix="/api/v1/admin/imports", tags=["admin"])


def _latest_run(db: Session, import_job_id: str) -> JobRun | None:
    return db.execute(
        select(JobRun)
        .where(JobRun.import_job_id == import_job_id)
        .order_by(JobRun.started_at.desc())
        .limit(1)
    ).scalar_one_or_none()


def _serialize_run(run: JobRun | None) -> dict | None:
    if run is None:
        return None
    return {
        "job_run_id": run.job_run_id,
        "run_status": run.run_status,
        "rows_total": run.rows_total,
        "rows_succeeded": run.rows_succeeded,
        "rows_failed": run.rows_failed,
        "error_summary": run.error_summary,
        "started_at": run.started_at,
        "finished_at": run.finished_at,
    }


def _serialize_job(job: ImportJob, run: JobRun | None = None) -> dict:
    return {
        "import_job_id": job.import_job_id,
        "file_name": job.file_name,
        "status": job.status,
        "source_type": job.source_type,
        "created_at": job.created_at,
        "created_by": job.created_by,
        "approved_by": job.approved_by,
        "approved_at": job.approved_at,
        "latest_run": _serialize_run(run),
    }


def _resolve_import_file(import_job_id: str, file_name: str) -> Path | None:
    settings = get_settings()
    tmp_dir = Path(settings.import_tmp_dir)

    expected_name = Path(file_name).name
    preferred = tmp_dir / f"{import_job_id}_{expected_name}"
    if preferred.exists():
        return preferred

    matches = sorted(tmp_dir.glob(f"{import_job_id}_*"))
    if matches:
        return matches[0]
    return None


@router.get("")
def list_import_jobs(
    _: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[dict]:
    jobs = db.execute(select(ImportJob).order_by(ImportJob.created_at.desc()).limit(100)).scalars().all()
    return [_serialize_job(job, _latest_run(db, job.import_job_id)) for job in jobs]


@router.post("")
async def upload_import_file(
    file: UploadFile = File(...),
    subject: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    settings = get_settings()
    file_bytes = await file.read()
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    import_job_id = f"IMPORT_{uuid4().hex[:12].upper()}"

    tmp_dir = Path(settings.import_tmp_dir)
    tmp_dir.mkdir(parents=True, exist_ok=True)
    target_path = tmp_dir / f"{import_job_id}_{file.filename}"
    target_path.write_bytes(file_bytes)

    db.add(
        ImportJob(
            import_job_id=import_job_id,
            file_name=file.filename or target_path.name,
            file_hash=file_hash,
            source_type="upload",
            status="uploaded",
            created_by=subject,
        )
    )
    write_audit(
        db,
        actor=subject,
        action="import_upload",
        entity_type="import_job",
        entity_id=import_job_id,
        detail={"file_name": file.filename, "target_path": target_path.as_posix()},
    )
    db.commit()
    return {"import_job_id": import_job_id, "status": "uploaded", "path": target_path.as_posix()}


@router.post("/{import_job_id}/run")
def run_import_validation(
    import_job_id: str,
    subject: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    job = db.get(ImportJob, import_job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="import job not found")

    target_path = _resolve_import_file(import_job_id, job.file_name)
    if target_path is None:
        raise HTTPException(status_code=404, detail="import file not found")

    report = build_import_report(target_path)
    valid = report["valid"]
    rows_total = int(report["rows_total"])
    rows_failed = 0 if valid else rows_total
    rows_succeeded = rows_total if valid else 0
    run_status = "completed" if valid else "failed"
    error_summary = None if valid else "; ".join(report["errors"][:3]) or "validation failed"

    run = JobRun(
        job_run_id=f"RUN_{uuid4().hex[:12].upper()}",
        import_job_id=import_job_id,
        run_status=run_status,
        rows_total=rows_total,
        rows_succeeded=rows_succeeded,
        rows_failed=rows_failed,
        error_summary=error_summary,
        finished_at=datetime.now(timezone.utc),
    )
    db.add(run)
    job.status = "validated" if valid else "validation_failed"
    job.approved_by = None
    job.approved_at = None

    write_audit(
        db,
        actor=subject,
        action="import_validate",
        entity_type="import_job",
        entity_id=import_job_id,
        detail={
            "file_path": target_path.as_posix(),
            "valid": valid,
            "rows_total": rows_total,
            "error_count": len(report["errors"]),
            "warning_count": len(report["warnings"]),
        },
    )
    db.commit()
    db.refresh(run)
    db.refresh(job)

    return {
        "import_job_id": import_job_id,
        "status": job.status,
        "latest_run": _serialize_run(run),
        "approved_by": job.approved_by,
        "approved_at": job.approved_at,
        "report": report,
    }


@router.get("/{import_job_id}/report")
def get_import_report(
    import_job_id: str,
    _: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    job = db.get(ImportJob, import_job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="import job not found")

    target_path = _resolve_import_file(import_job_id, job.file_name)
    if target_path is None:
        raise HTTPException(status_code=404, detail="import file not found")

    report = build_import_report(target_path)
    latest = _latest_run(db, import_job_id)
    return {
        **_serialize_job(job, latest),
        "file_path": target_path.as_posix(),
        "report": report,
    }


@router.post("/{import_job_id}/approve")
def approve_import_job(
    import_job_id: str,
    subject: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    job = db.get(ImportJob, import_job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="import job not found")

    target_path = _resolve_import_file(import_job_id, job.file_name)
    if target_path is None:
        raise HTTPException(status_code=404, detail="import file not found")

    latest = _latest_run(db, import_job_id)
    if latest is None or latest.run_status != "completed":
        raise HTTPException(status_code=409, detail="import blocked: run validation first")

    report = build_import_report(target_path)
    if not report["valid"]:
        raise HTTPException(status_code=409, detail="import blocked: validation failed")

    approved_at = datetime.now(timezone.utc)
    job.status = "approved"
    job.approved_by = subject
    job.approved_at = approved_at

    write_audit(
        db,
        actor=subject,
        action="import_approve",
        entity_type="import_job",
        entity_id=import_job_id,
        detail={
            "file_path": target_path.as_posix(),
            "approved_at": approved_at.isoformat(),
            "latest_run_id": latest.job_run_id,
        },
    )
    db.commit()
    db.refresh(job)

    return {
        "import_job_id": import_job_id,
        "status": job.status,
        "approved_by": job.approved_by,
        "approved_at": job.approved_at,
        "latest_run": _serialize_run(latest),
    }


@router.post("/{import_job_id}/apply")
def apply_import_job(
    import_job_id: str,
    subject: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    job = db.get(ImportJob, import_job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="import job not found")

    target_path = _resolve_import_file(import_job_id, job.file_name)
    if target_path is None:
        raise HTTPException(status_code=404, detail="import file not found")

    if job.status != "approved" or not job.approved_by:
        raise HTTPException(status_code=409, detail="import blocked: approval required")

    latest_validation = _latest_run(db, import_job_id)
    if latest_validation is None or latest_validation.run_status != "completed":
        raise HTTPException(status_code=409, detail="import blocked: run validation first")

    report = build_import_report(target_path)
    if not report["valid"]:
        raise HTTPException(status_code=409, detail="import blocked: validation failed")

    try:
        run_result = run_import(
            target_path,
            import_job_id=import_job_id,
            created_by=subject,
            source_type="upload",
            reuse_existing_job=True,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"import apply failed: {exc}") from exc

    db.expire_all()
    latest = _latest_run(db, import_job_id)
    refreshed = db.get(ImportJob, import_job_id)
    assert refreshed is not None
    write_audit(
        db,
        actor=subject,
        action="import_apply",
        entity_type="import_job",
        entity_id=import_job_id,
        detail={
            "file_path": target_path.as_posix(),
            "rows_total": run_result["rows_total"],
            "job_run_id": run_result["job_run_id"],
        },
    )
    db.commit()

    return {
        "import_job_id": refreshed.import_job_id,
        "status": refreshed.status,
        "file_name": refreshed.file_name,
        "approved_by": refreshed.approved_by,
        "approved_at": refreshed.approved_at,
        "latest_run": _serialize_run(latest),
        "rows_total": run_result["rows_total"],
    }
