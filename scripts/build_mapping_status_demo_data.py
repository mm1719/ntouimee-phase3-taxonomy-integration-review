#!/usr/bin/env python3
"""Build mapping-status public data for the taxonomy integration review demo."""

from __future__ import annotations

import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
DEMO_ROOT = SCRIPT_DIR.parent
ROOT = SCRIPT_DIR.parents[2]
ML_READY_DIR = ROOT / "derived/ml_ready"
TARGET_PROFILES = ML_READY_DIR / "target_profiles.csv"
HISTORY_DIR = ML_READY_DIR / "mapping_history"
OUT_JSON = DEMO_ROOT / "public/data/mapping_status.json"

EXPORT_FIELDS = [
    "action",
    "source_id",
    "target_id",
    "source_alias",
    "target_alias",
    "notes",
]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def target_alias(row: dict[str, str]) -> str:
    return row.get("class_display_name") or row.get("source_labels") or row["aphia_id"]


def normalize_action(value: str) -> str:
    action = value.strip().lower()
    return action if action in {"keep", "merge", "drop"} else "keep"


def safe_history_id(path: Path) -> str:
    return re.sub(r"[^a-z0-9]+", "_", path.stem.lower()).strip("_") or "mapping"


def load_targets() -> list[dict[str, Any]]:
    rows = read_csv(TARGET_PROFILES)
    targets = []
    for row in rows:
        targets.append(
            {
                "source_id": row["aphia_id"],
                "source_alias": target_alias(row),
                "image_count": int(row["image_count"]),
                "valid_statuses": row["valid_statuses"],
                "invalid_reasons": row["invalid_reasons"],
                "risk_flags": row["risk_flags"],
                "dataset_ids": row["dataset_ids"],
                "source_labels": row["source_labels"],
            }
        )
    return targets


def blank_rule(target: dict[str, Any]) -> dict[str, str]:
    return {
        "action": "keep",
        "source_id": str(target["source_id"]),
        "target_id": "",
        "source_alias": str(target["source_alias"]),
        "target_alias": "",
        "notes": "",
        "validation_status": "ok",
        "validation_message": "",
    }


def normalize_rule(
    raw: dict[str, str],
    targets_by_id: dict[str, dict[str, Any]],
) -> dict[str, str]:
    source_id = raw.get("source_id", "").strip()
    source = targets_by_id.get(source_id)
    action = normalize_action(raw.get("action", "keep"))
    target_id = raw.get("target_id", "").strip()
    notes = raw.get("notes", "").strip()

    if not source:
        return {
            "action": action,
            "source_id": source_id,
            "target_id": target_id,
            "source_alias": raw.get("source_alias", "").strip(),
            "target_alias": raw.get("target_alias", "").strip(),
            "notes": notes,
            "validation_status": "invalid_source_id",
            "validation_message": "source_id is not present in current ML-ready targets",
        }

    if action == "merge" and target_id == source_id:
        action = "keep"
        target_id = ""
        notes = (notes + "; " if notes else "") + "self-merge normalized to keep"

    target_alias_value = ""
    validation_status = "ok"
    validation_message = ""
    if action == "merge":
        target = targets_by_id.get(target_id)
        if target:
            target_alias_value = str(target["source_alias"])
        else:
            validation_status = "invalid_target_id"
            validation_message = "merge target_id is not present in current ML-ready targets"
    elif action == "drop":
        target_id = ""
    else:
        target_id = ""
        action = "keep"

    return {
        "action": action,
        "source_id": source_id,
        "target_id": target_id,
        "source_alias": str(source["source_alias"]),
        "target_alias": target_alias_value,
        "notes": notes,
        "validation_status": validation_status,
        "validation_message": validation_message,
    }


def load_history(path: Path, targets: list[dict[str, Any]]) -> dict[str, Any]:
    targets_by_id = {str(target["source_id"]): target for target in targets}
    merged = {str(target["source_id"]): blank_rule(target) for target in targets}
    warnings = []

    for raw in read_csv(path):
        normalized = normalize_rule(raw, targets_by_id)
        source_id = normalized["source_id"]
        if source_id in merged:
            merged[source_id] = normalized
        else:
            warnings.append(
                {
                    "source_id": source_id,
                    "message": normalized["validation_message"],
                }
            )

    rows = [merged[str(target["source_id"])] for target in targets]
    explicit_rows = [
        row
        for row in rows
        if row["action"] in {"merge", "drop"}
        or row["validation_status"] != "ok"
    ]
    return {
        "history_id": safe_history_id(path),
        "file_name": path.name,
        "path": str(path.relative_to(ROOT)),
        "row_count": len(rows),
        "explicit_row_count": len(explicit_rows),
        "merge_count": sum(row["action"] == "merge" for row in rows),
        "drop_count": sum(row["action"] == "drop" for row in rows),
        "warning_count": len(warnings)
        + sum(row["validation_status"] != "ok" for row in rows),
        "warnings": warnings,
        "rows": rows,
    }


def main() -> int:
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    targets = load_targets()
    history_paths = sorted(HISTORY_DIR.glob("*.csv"), key=lambda path: path.name)
    histories = [load_history(path, targets) for path in history_paths]
    payload = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source_targets": str(TARGET_PROFILES.relative_to(ROOT)),
        "history_dir": str(HISTORY_DIR.relative_to(ROOT)),
        "export_fields": EXPORT_FIELDS,
        "target_count": len(targets),
        "targets": targets,
        "latest_history_id": histories[-1]["history_id"] if histories else "",
        "histories": histories,
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "mapping_status": str(OUT_JSON.relative_to(ROOT)),
                "target_count": len(targets),
                "history_count": len(histories),
                "latest_history_id": payload["latest_history_id"],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
