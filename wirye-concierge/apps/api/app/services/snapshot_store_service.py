import hashlib
import json
from pathlib import Path
from typing import Any

from fastapi.encoders import jsonable_encoder


def snapshot_file_path(snapshot_dir: str, hotel_id: str, version_no: int) -> Path:
    return Path(snapshot_dir) / hotel_id / f"v{version_no}.json"


def write_snapshot_payload(
    payload: dict[str, Any],
    snapshot_dir: str,
    hotel_id: str,
    version_no: int,
) -> tuple[str, str]:
    target_path = snapshot_file_path(snapshot_dir, hotel_id, version_no)
    target_path.parent.mkdir(parents=True, exist_ok=True)

    encoded_payload = jsonable_encoder(payload)
    content = json.dumps(encoded_payload, ensure_ascii=False, indent=2, sort_keys=True)
    content_bytes = content.encode("utf-8")
    checksum = hashlib.sha256(content_bytes).hexdigest()

    temp_path = target_path.with_suffix(f"{target_path.suffix}.tmp")
    temp_path.write_bytes(content_bytes)
    temp_path.replace(target_path)

    return target_path.as_posix(), checksum


def read_snapshot_payload(snapshot_dir: str, snapshot_path: str) -> dict[str, Any] | None:
    path = Path(snapshot_path)
    if not path.is_absolute():
        path = Path(snapshot_dir) / path

    if not path.exists():
        return None

    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError, json.JSONDecodeError):
        return None
