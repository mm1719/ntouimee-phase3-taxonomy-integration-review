#!/usr/bin/env python3
"""Refresh demo public-data metadata hashes."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DEMO_ROOT = SCRIPT_DIR.parent
ROOT = SCRIPT_DIR.parents[2]
DATA_DIR = DEMO_ROOT / "public/data"
OUT = DATA_DIR / "demo_data_metadata.json"

ARTIFACTS = [
    "taxonomy_tree.json",
    "valid_class_candidates.csv",
    "class_image_samples.json",
    "invalid_label_groups.json",
    "mapping_status.json",
    "worms_lineages.json",
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    metadata = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "demo_app": "demo/taxonomy-integration-review",
        "phase_3_root": str(ROOT),
        "source_studies": [
            "studies/valid_class_taxonomy_visualization",
            "studies/invalid_label_visualization",
            "studies/label_aphia_inventory/worms_invalid_labels_for_review.csv",
            "studies/label_aphia_inventory/invalid_label_cleanup_decisions.csv",
        ],
        "generators": [
            "scripts/study_valid_class_taxonomy_visualization.py",
            "demo/taxonomy-integration-review/scripts/build_valid_class_demo_samples.py",
            "demo/taxonomy-integration-review/scripts/build_invalid_label_demo_data.py",
            "demo/taxonomy-integration-review/scripts/build_mapping_status_demo_data.py",
            "demo/taxonomy-integration-review/scripts/refresh_demo_data_metadata.py",
        ],
        "public_artifacts": {},
        "thumbnail_dirs": [
            "public/samples",
            "public/invalid-samples",
        ],
    }
    for name in ARTIFACTS:
        path = DATA_DIR / name
        metadata["public_artifacts"][name] = {
            "path": f"public/data/{name}",
            "sha256": sha256(path),
            "bytes": path.stat().st_size,
        }
    OUT.write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"metadata": str(OUT), "artifacts": len(ARTIFACTS)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
