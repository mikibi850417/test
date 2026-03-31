import hashlib
import json
from pathlib import Path
from typing import Any

EXPECTED_TABLES = [
    "hotel_master",
    "hotel_dining",
    "hotel_facilities",
    "hotel_services",
    "transport_access",
    "nearby_places",
    "nearby_routes",
    "emergency_safety",
    "faq_intents",
    "temporary_notices",
    "conflicts_log",
]

PRIMARY_KEY_FIELDS = {
    "hotel_master": "hotel_id",
    "hotel_dining": "dining_id",
    "hotel_facilities": "facility_id",
    "hotel_services": "service_id",
    "transport_access": "transport_id",
    "nearby_places": "place_id",
    "nearby_routes": "route_id",
    "emergency_safety": "emergency_id",
    "faq_intents": "intent_id",
    "temporary_notices": "notice_id",
    "conflicts_log": "conflict_id",
}


def _sha256(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()


def _error(errors: list[str], message: str) -> None:
    if len(errors) < 100:
        errors.append(message)


def build_import_report(file_path: Path) -> dict[str, Any]:
    if not file_path.exists():
        return {
            "valid": False,
            "errors": [f"file not found: {file_path.as_posix()}"],
            "warnings": [],
            "table_counts": {},
            "rows_total": 0,
            "file_hash": None,
            "file_size_bytes": 0,
        }

    file_bytes = file_path.read_bytes()
    file_hash = _sha256(file_bytes)
    file_size = len(file_bytes)
    errors: list[str] = []
    warnings: list[str] = []

    try:
        payload = json.loads(file_bytes.decode("utf-8"))
    except UnicodeDecodeError:
        return {
            "valid": False,
            "errors": ["file encoding must be UTF-8 JSON"],
            "warnings": [],
            "table_counts": {},
            "rows_total": 0,
            "file_hash": file_hash,
            "file_size_bytes": file_size,
        }
    except json.JSONDecodeError as exc:
        return {
            "valid": False,
            "errors": [f"invalid JSON: {exc.msg} (line {exc.lineno}, column {exc.colno})"],
            "warnings": [],
            "table_counts": {},
            "rows_total": 0,
            "file_hash": file_hash,
            "file_size_bytes": file_size,
        }

    if not isinstance(payload, dict):
        return {
            "valid": False,
            "errors": ["root JSON must be an object"],
            "warnings": [],
            "table_counts": {},
            "rows_total": 0,
            "file_hash": file_hash,
            "file_size_bytes": file_size,
        }

    tables = payload.get("tables")
    if not isinstance(tables, dict):
        return {
            "valid": False,
            "errors": ["`tables` must be an object of table_name -> rows[]"],
            "warnings": [],
            "table_counts": {},
            "rows_total": 0,
            "file_hash": file_hash,
            "file_size_bytes": file_size,
        }

    expected = set(EXPECTED_TABLES)
    for table_name in sorted(set(tables.keys()) - expected):
        warnings.append(f"unexpected table ignored: {table_name}")

    table_counts: dict[str, int] = {}
    for table_name in EXPECTED_TABLES:
        rows = tables.get(table_name, [])
        if rows is None:
            rows = []

        if not isinstance(rows, list):
            _error(errors, f"{table_name}: rows must be an array")
            table_counts[table_name] = 0
            continue

        table_counts[table_name] = len(rows)
        pk_field = PRIMARY_KEY_FIELDS.get(table_name)
        if pk_field is None:
            continue

        seen_keys: set[str] = set()
        for index, row in enumerate(rows, start=1):
            if not isinstance(row, dict):
                _error(errors, f"{table_name}[{index}] must be an object")
                continue

            key_value = row.get(pk_field)
            if key_value in (None, ""):
                _error(errors, f"{table_name}[{index}] missing `{pk_field}`")
                continue

            key_text = str(key_value)
            if key_text in seen_keys:
                _error(errors, f"{table_name}[{index}] duplicated `{pk_field}`: {key_text}")
                continue
            seen_keys.add(key_text)

    if table_counts.get("hotel_master", 0) == 0:
        _error(errors, "hotel_master must include at least one row")

    rows_total = sum(table_counts.values())
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings[:100],
        "table_counts": table_counts,
        "rows_total": rows_total,
        "file_hash": file_hash,
        "file_size_bytes": file_size,
    }
