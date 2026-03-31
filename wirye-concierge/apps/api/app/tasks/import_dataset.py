import argparse
import hashlib
import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.conflict import ConflictLog
from app.models.dining import HotelDining
from app.models.emergency import EmergencySafety
from app.models.facility import HotelFacility
from app.models.faq import FaqIntent
from app.models.hotel import HotelMaster
from app.models.hotel_service import HotelService
from app.models.import_job import ImportJob, JobRun
from app.models.nearby import NearbyPlace
from app.models.nearby_route import NearbyRoute
from app.models.notice import TemporaryNotice
from app.models.transport import TransportAccess


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(8192), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _clean(value):
    if value in ("", "N/A"):
        return None
    if isinstance(value, str) and value.strip().lower() in {"unknown", "unverified"}:
        return None
    return value


def _as_int(value) -> int | None:
    value = _clean(value)
    if value is None:
        return None
    if isinstance(value, bool):
        return int(value)
    return int(float(value))


def _as_float(value) -> float | None:
    value = _clean(value)
    if value is None:
        return None
    return float(value)


def _replace_table(db: Session, model, rows) -> int:
    db.execute(delete(model))
    for row in rows:
        db.add(row)
    return len(rows)


def _apply_tables(db: Session, tables: dict[str, Any]) -> int:
    processed = 0

    hotel_rows = tables.get("hotel_master", [])
    for row in hotel_rows:
        db.merge(
            HotelMaster(
                hotel_id=row["hotel_id"],
                status=row.get("status", "active"),
                name_ko=row.get("name_ko", row["hotel_id"]),
                name_en=row.get("name_en"),
                address_road=row.get("address_road"),
                phone_main=row.get("phone_main"),
                check_in_time=row.get("check_in_time"),
                check_out_time=row.get("check_out_time"),
                latitude=_as_float(row.get("latitude")),
                longitude=_as_float(row.get("longitude")),
                source_confidence=row.get("source_confidence"),
                verification_status=row.get("verification_status"),
                last_verified_at=_parse_date(row.get("last_verified_at")),
                note=row.get("note"),
            )
        )
        processed += 1

    dining_rows = []
    for row in tables.get("hotel_dining", []):
        dining_rows.append(
            HotelDining(
                dining_id=row["dining_id"],
                hotel_id=row["hotel_id"],
                status=row.get("status", "active"),
                venue_name=row.get("venue_name", row["dining_id"]),
                venue_type=row.get("venue_type"),
                floor_location=row.get("floor_location"),
                phone=row.get("phone"),
                breakfast_yn=row.get("breakfast_yn"),
                lunch_yn=row.get("lunch_yn"),
                dinner_yn=row.get("dinner_yn"),
                bar_yn=row.get("bar_yn"),
                hours_mon=row.get("hours_mon"),
                hours_tue=row.get("hours_tue"),
                hours_wed=row.get("hours_wed"),
                hours_thu=row.get("hours_thu"),
                hours_fri=row.get("hours_fri"),
                hours_sat=row.get("hours_sat"),
                hours_sun=row.get("hours_sun"),
                holiday_hours=row.get("holiday_hours"),
                pricing_notes=row.get("pricing_notes"),
                breakfast_adult_price_krw=_as_int(row.get("breakfast_adult_price_krw")),
                breakfast_child_price_krw=_as_int(row.get("breakfast_child_price_krw")),
                source_confidence=row.get("source_confidence"),
                last_verified_at=_parse_date(row.get("last_verified_at")),
                note=row.get("note"),
            )
        )
    processed += _replace_table(db, HotelDining, dining_rows)

    facility_rows = []
    for row in tables.get("hotel_facilities", []):
        facility_rows.append(
            HotelFacility(
                facility_id=row["facility_id"],
                hotel_id=row["hotel_id"],
                status=row.get("status", "active"),
                facility_name=row.get("facility_name", row["facility_id"]),
                facility_type=row.get("facility_type"),
                floor_location=row.get("floor_location"),
                description=row.get("description"),
                hours_mon=row.get("hours_mon"),
                hours_tue=row.get("hours_tue"),
                hours_wed=row.get("hours_wed"),
                hours_thu=row.get("hours_thu"),
                hours_fri=row.get("hours_fri"),
                hours_sat=row.get("hours_sat"),
                hours_sun=row.get("hours_sun"),
                fee_required_yn=row.get("fee_required_yn"),
                fee_note=row.get("fee_note"),
                age_limit_min=_as_int(row.get("age_limit_min")),
                age_policy_note=row.get("age_policy_note"),
                phone=row.get("phone"),
                source_confidence=row.get("source_confidence"),
                last_verified_at=_parse_date(row.get("last_verified_at")),
                note=row.get("note"),
            )
        )
    processed += _replace_table(db, HotelFacility, facility_rows)

    service_rows = []
    for row in tables.get("hotel_services", []):
        service_rows.append(
            HotelService(
                service_id=row["service_id"],
                hotel_id=row["hotel_id"],
                status=row.get("status", "active"),
                service_name=row.get("service_name", row["service_id"]),
                service_category=row.get("service_category"),
                request_channel=row.get("request_channel"),
                service_hours=row.get("service_hours"),
                reservation_required_yn=row.get("reservation_required_yn"),
                fee_required_yn=row.get("fee_required_yn"),
                fee_note=row.get("fee_note"),
                language_support_csv=row.get("language_support_csv"),
                service_note=row.get("service_note"),
                phone=row.get("phone"),
                source_confidence=row.get("source_confidence"),
                last_verified_at=_parse_date(row.get("last_verified_at")),
                note=row.get("note"),
            )
        )
    processed += _replace_table(db, HotelService, service_rows)

    transport_rows = []
    for row in tables.get("transport_access", []):
        transport_rows.append(
            TransportAccess(
                transport_id=row["transport_id"],
                hotel_id=row["hotel_id"],
                status=row.get("status", "active"),
                origin_name=row.get("origin_name", row["transport_id"]),
                origin_type=row.get("origin_type"),
                transport_mode=row.get("transport_mode"),
                recommended_yn=row.get("recommended_yn"),
                distance_km=_as_float(row.get("distance_km")),
                duration_min=_as_int(row.get("duration_min")),
                fare_note=row.get("fare_note"),
                first_service_time=row.get("first_service_time"),
                last_service_time=row.get("last_service_time"),
                route_detail=row.get("route_detail"),
                source_confidence=row.get("source_confidence"),
                last_verified_at=_parse_date(row.get("last_verified_at")),
                note=row.get("note"),
            )
        )
    processed += _replace_table(db, TransportAccess, transport_rows)

    nearby_rows = []
    for row in tables.get("nearby_places", []):
        nearby_rows.append(
            NearbyPlace(
                place_id=row["place_id"],
                hotel_id=row["hotel_id"],
                status=row.get("status", "active"),
                place_name=row.get("place_name", row["place_id"]),
                category=row.get("category"),
                subcategory=row.get("subcategory"),
                description_short=row.get("description_short"),
                address=row.get("address"),
                latitude=_as_float(row.get("latitude")),
                longitude=_as_float(row.get("longitude")),
                hotel_distance_km=_as_float(row.get("hotel_distance_km")),
                walk_time_min=_as_int(row.get("walk_time_min")),
                drive_time_min=_as_int(row.get("drive_time_min")),
                transit_time_min=_as_int(row.get("transit_time_min")),
                child_friendly_yn=row.get("child_friendly_yn"),
                pet_friendly_yn=row.get("pet_friendly_yn"),
                late_night_yn=row.get("late_night_yn"),
                tags_csv=row.get("tags_csv"),
                source_confidence=row.get("source_confidence"),
                verification_status=row.get("verification_status"),
                last_verified_at=_parse_date(row.get("last_verified_at")),
                note=row.get("note"),
            )
        )
    processed += _replace_table(db, NearbyPlace, nearby_rows)

    route_rows = []
    for row in tables.get("nearby_routes", []):
        route_rows.append(
            NearbyRoute(
                route_id=row["route_id"],
                hotel_id=row["hotel_id"],
                destination_place_id=row["destination_place_id"],
                status=row.get("status", "active"),
                start_point=row.get("start_point"),
                transport_mode=row.get("transport_mode"),
                estimated_duration_min=_as_int(row.get("estimated_duration_min")),
                step_1=row.get("step_1"),
                step_2=row.get("step_2"),
                step_3=row.get("step_3"),
                step_4=row.get("step_4"),
                stairs_yn=row.get("stairs_yn"),
                elevator_yn=row.get("elevator_yn"),
                wheelchair_note=row.get("wheelchair_note"),
                source_confidence=row.get("source_confidence"),
                last_verified_at=_parse_date(row.get("last_verified_at")),
                note=row.get("note"),
            )
        )
    processed += _replace_table(db, NearbyRoute, route_rows)

    emergency_rows = []
    for row in tables.get("emergency_safety", []):
        emergency_rows.append(
            EmergencySafety(
                emergency_id=row["emergency_id"],
                hotel_id=row["hotel_id"],
                status=row.get("status", "active"),
                contact_name=row.get("contact_name", row["emergency_id"]),
                category=row.get("category"),
                phone=row.get("phone"),
                address=row.get("address"),
                hotel_distance_km=_as_float(row.get("hotel_distance_km")),
                drive_time_min=_as_int(row.get("drive_time_min")),
                available_24h_yn=row.get("available_24h_yn"),
                language_support_note=row.get("language_support_note"),
                description=row.get("description"),
                source_confidence=row.get("source_confidence"),
                last_verified_at=_parse_date(row.get("last_verified_at")),
                note=row.get("note"),
            )
        )
    processed += _replace_table(db, EmergencySafety, emergency_rows)

    faq_rows = []
    for row in tables.get("faq_intents", []):
        faq_rows.append(
            FaqIntent(
                intent_id=row["intent_id"],
                hotel_id=row["hotel_id"],
                status=row.get("status", "active"),
                intent_group=row.get("intent_group"),
                user_question_example_ko=row.get("user_question_example_ko"),
                user_question_example_en=row.get("user_question_example_en"),
                answer_template_ko=row.get("answer_template_ko"),
                answer_template_en=row.get("answer_template_en"),
                primary_sheet=row.get("primary_sheet"),
                primary_lookup_key=row.get("primary_lookup_key"),
                escalation_required_yn=row.get("escalation_required_yn"),
                note=row.get("note"),
            )
        )
    processed += _replace_table(db, FaqIntent, faq_rows)

    notice_rows = []
    for row in tables.get("temporary_notices", []):
        notice_rows.append(
            TemporaryNotice(
                notice_id=row["notice_id"],
                hotel_id=row["hotel_id"],
                status=row.get("status", "active"),
                target_type=row.get("target_type"),
                target_id=row.get("target_id"),
                notice_title=row.get("notice_title"),
                notice_body=row.get("notice_body"),
                start_at=_parse_datetime(row.get("start_at")),
                end_at=_parse_datetime(row.get("end_at")),
                impact_level=row.get("impact_level"),
                alternate_option=row.get("alternate_option"),
                source_confidence=row.get("source_confidence"),
                last_verified_at=_parse_date(row.get("last_verified_at")),
                note=row.get("note"),
            )
        )
    processed += _replace_table(db, TemporaryNotice, notice_rows)

    conflict_rows = tables.get("conflicts_log", [])
    if hotel_rows:
        hotel_id = hotel_rows[0].get("hotel_id")
    else:
        hotel_id = "HOTEL_WIRYE_MILITOPIA_001"

    normalized_conflicts = []
    for row in conflict_rows:
        normalized_conflicts.append(
            ConflictLog(
                conflict_id=row["conflict_id"],
                hotel_id=row.get("hotel_id", hotel_id),
                entity_type=row.get("entity_type", "unknown"),
                entity_id=row.get("entity_id"),
                field_name=row.get("field_name", "unknown"),
                value_a=row.get("value_a"),
                source_a_url=row.get("source_a_url"),
                value_b=row.get("value_b"),
                source_b_url=row.get("source_b_url"),
                recommended_action=row.get("recommended_action"),
                status=row.get("status", "open"),
                last_verified_at=_parse_date(row.get("last_verified_at")),
                note=row.get("note"),
                resolved_note=row.get("resolved_note"),
                resolved_by=row.get("resolved_by"),
                resolved_at=_parse_datetime(row.get("resolved_at")),
            )
        )
    processed += _replace_table(db, ConflictLog, normalized_conflicts)

    return processed


def run_import(
    file_path: Path,
    *,
    import_job_id: str | None = None,
    created_by: str | None = None,
    source_type: str = "json",
    reuse_existing_job: bool = False,
) -> dict[str, Any]:
    if not file_path.exists():
        raise FileNotFoundError(f"file not found: {file_path}")

    payload = json.loads(file_path.read_text(encoding="utf-8"))
    tables = payload.get("tables", {})
    if not isinstance(tables, dict):
        raise ValueError("`tables` must be an object")

    db = SessionLocal()
    resolved_import_job_id = import_job_id or f"IMPORT_{uuid4().hex[:12].upper()}"
    job_run_id = f"RUN_{uuid4().hex[:12].upper()}"
    processed = 0

    try:
        if reuse_existing_job:
            import_job = db.get(ImportJob, resolved_import_job_id)
            if import_job is None:
                raise ValueError(f"import job not found: {resolved_import_job_id}")
            import_job.status = "running"
            if not import_job.file_hash:
                import_job.file_hash = _sha256(file_path)
            if created_by and not import_job.created_by:
                import_job.created_by = created_by
        else:
            import_job = ImportJob(
                import_job_id=resolved_import_job_id,
                file_name=file_path.name,
                file_hash=_sha256(file_path),
                source_type=source_type,
                status="running",
                created_by=created_by,
            )
            db.add(import_job)

        db.add(
            JobRun(
                job_run_id=job_run_id,
                import_job_id=resolved_import_job_id,
                run_status="running",
            )
        )
        db.commit()

        processed = _apply_tables(db, tables)
        completed_at = datetime.now(timezone.utc)

        run = db.get(JobRun, job_run_id)
        parent = db.get(ImportJob, resolved_import_job_id)
        assert run is not None
        assert parent is not None

        run.run_status = "completed"
        run.rows_total = processed
        run.rows_succeeded = processed
        run.rows_failed = 0
        run.error_summary = None
        run.finished_at = completed_at

        parent.status = "completed"
        db.commit()
        return {
            "import_job_id": resolved_import_job_id,
            "job_run_id": job_run_id,
            "rows_total": processed,
            "status": "completed",
        }
    except Exception as exc:
        db.rollback()
        failed = db.get(JobRun, job_run_id)
        parent = db.get(ImportJob, resolved_import_job_id)
        if failed is not None:
            failed.run_status = "failed"
            failed.rows_total = processed
            failed.rows_succeeded = 0
            failed.rows_failed = processed
            failed.error_summary = str(exc)
            failed.finished_at = datetime.now(timezone.utc)
        if parent is not None:
            parent.status = "failed"
        db.commit()
        raise
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Import dataset JSON into Wirye DB")
    parser.add_argument("--file", required=True, help="Path to dataset JSON file")
    args = parser.parse_args()
    result = run_import(Path(args.file))
    print(f"Import completed. rows={result['rows_total']} job={result['import_job_id']}")


if __name__ == "__main__":
    main()
