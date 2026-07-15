#!/usr/bin/env python3
"""Build sample image metadata for the valid-class taxonomy demo."""

from __future__ import annotations

import csv
import hashlib
import json
import re
import shutil
from collections import defaultdict
from pathlib import Path

from PIL import Image, ImageOps


SCRIPT_DIR = Path(__file__).resolve().parent
DEMO_ROOT = SCRIPT_DIR.parent
ROOT = SCRIPT_DIR.parents[2]
CANDIDATES = ROOT / "studies/taxonomy_integration_review/valid_class_candidates.csv"
OUT = DEMO_ROOT / "public/data/class_image_samples.json"
SAMPLES_DIR = DEMO_ROOT / "public/samples"
SAMPLE_LIMIT = 8
THUMBNAIL_MAX_EDGE = 256

MANIFESTS = {
    "life_watch": {
        "path": ROOT / "derived/analysis_ready/life_watch/image_level_manifest.csv",
        "label": "label_original",
        "image_path": "source_path",
        "image_id": "image_id",
        "aphia_id": "aphia_id",
        "width": "width",
        "height": "height",
    },
    "life_watch_2026_image_library": {
        "path": ROOT / "derived/analysis_ready/life_watch_2026_image_library/manifest.csv",
        "label": "label_original",
        "image_path": "source_path",
        "image_id": "image_id",
        "aphia_id": "aphia_id",
        "width": "width",
        "height": "height",
    },
    "flowcam_net": {
        "path": ROOT / "derived/analysis_ready/flowcam_net/image_level_manifest.csv",
        "label": "label_original",
        "image_path": "staging_path",
        "image_id": "image_id",
        "width": "width",
        "height": "height",
    },
    "tara_pacific_deck": {
        "path": ROOT / "derived/cleaned/tara_pacific_deck_scale_bar_removed/manifest.csv",
        "label": "label_original",
        "image_path": "cleaned_path",
        "image_id": "image_id",
        "width": "image_width",
        "height": "image_height",
    },
    "tara_pacific_bongo": {
        "path": ROOT / "derived/cleaned/tara_pacific_bongo_scale_bar_removed/manifest.csv",
        "label": "label_original",
        "image_path": "cleaned_path",
        "image_id": "image_id",
        "width": "image_width",
        "height": "image_height",
    },
    "ifremer_srn": {
        "path": ROOT / "derived/analysis_ready/ifremer_srn/image_level_manifest.csv",
        "label": "label_original",
        "image_path": "staging_path",
        "image_id": "image_id",
        "width": "width",
        "height": "height",
    },
}


def safe_segment(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", value.strip())
    return cleaned.strip("._")[:80] or "unknown"


def relative_ref(value: str) -> str:
    if not value:
        return ""
    path = Path(value)
    try:
        if path.is_absolute():
            return str(path.relative_to(ROOT.resolve()))
    except ValueError:
        return path.name
    return str(path)


def read_candidates() -> dict[str, dict[str, dict[str, str]]]:
    labels: dict[str, dict[str, dict[str, str]]] = defaultdict(dict)
    with CANDIDATES.open("r", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            source_label = row.get("original_label") or row["label"]
            labels[row["dataset_id"]][source_label] = {
                "display_label": row["label"],
                "entry_id": row["entry_id"],
                "selected_aphia_ids": row.get("selected_aphia_ids", ""),
            }
    return labels


def label_key(value: str) -> str:
    return re.sub(r"[\s_]+", " ", value.strip().casefold())


def write_thumbnail(source: Path, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        image.thumbnail((THUMBNAIL_MAX_EDGE, THUMBNAIL_MAX_EDGE), Image.Resampling.LANCZOS)
        if image.mode not in {"RGB", "L"}:
            image = image.convert("RGB")
        image.save(output, format="JPEG", quality=82, optimize=True)


def build_samples() -> dict[str, list[dict[str, str]]]:
    wanted = read_candidates()
    wanted_by_key = {
        dataset_id: {
            label_key(source_label): data
            for source_label, data in labels.items()
        }
        for dataset_id, labels in wanted.items()
    }
    samples: dict[str, list[dict[str, str]]] = defaultdict(list)
    if SAMPLES_DIR.exists():
        shutil.rmtree(SAMPLES_DIR)
    for dataset_id, cfg in MANIFESTS.items():
        remaining = {data["entry_id"] for data in wanted[dataset_id].values()}
        with cfg["path"].open("r", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                source_label = row.get(cfg["label"], "")
                candidate = wanted_by_key[dataset_id].get(label_key(source_label), {})
                label = candidate.get("display_label", "")
                entry_id = candidate.get("entry_id", "")
                if not entry_id or entry_id not in remaining:
                    continue
                selected_aphia_ids = [
                    item for item in candidate.get("selected_aphia_ids", "").split("|") if item
                ]
                if len(samples[entry_id]) >= SAMPLE_LIMIT:
                    primary_full = True
                else:
                    primary_full = False
                aphia_id = row.get(cfg.get("aphia_id", ""), "")
                aphia_sample_key = (
                    f"{entry_id}::aphia::{aphia_id}"
                    if aphia_id
                    and aphia_id in selected_aphia_ids
                    else ""
                )
                if primary_full and (
                    not aphia_sample_key or len(samples[aphia_sample_key]) >= SAMPLE_LIMIT
                ):
                    continue
                source_value = row.get(cfg["image_path"], "")
                source_path = Path(source_value)
                if not source_path.is_absolute():
                    source_path = ROOT / source_path
                if not source_path.exists():
                    continue
                sample_index = len(samples[entry_id]) + 1
                digest = hashlib.sha1(
                    f"{entry_id}:{row.get(cfg['image_id'], '')}:{source_value}:{sample_index}".encode("utf-8")
                ).hexdigest()[:10]
                output_rel = Path("samples") / safe_segment(dataset_id) / safe_segment(label) / f"{sample_index:02d}_{digest}.jpg"
                output_path = DEMO_ROOT / "public" / output_rel
                try:
                    write_thumbnail(source_path, output_path)
                except Exception:
                    continue
                sample_row = {
                    "dataset_id": dataset_id,
                    "label": label,
                    "image_id": row.get(cfg["image_id"], ""),
                    "thumbnail_url": "/" + str(output_rel),
                    "source_ref": relative_ref(source_value),
                    "width": row.get(cfg["width"], ""),
                    "height": row.get(cfg["height"], ""),
                }
                if not primary_full:
                    samples[entry_id].append(sample_row)
                if aphia_sample_key and len(samples[aphia_sample_key]) < SAMPLE_LIMIT:
                    samples[aphia_sample_key].append(sample_row)
                aphia_full = all(
                    len(samples.get(f"{entry_id}::aphia::{selected_id}", [])) >= SAMPLE_LIMIT
                    for selected_id in selected_aphia_ids
                )
                if len(samples[entry_id]) >= SAMPLE_LIMIT and (
                    len(selected_aphia_ids) <= 1 or aphia_full
                ):
                    remaining.discard(entry_id)
                    if not remaining:
                        break
    return dict(sorted(samples.items()))


def main() -> int:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    samples = build_samples()
    OUT.write_text(
        json.dumps(samples, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    missing = []
    for dataset_id, labels in read_candidates().items():
        for data in labels.values():
            entry_id = data["entry_id"]
            if not samples.get(entry_id):
                missing.append(entry_id)
    print(
        json.dumps(
            {
                "out": str(OUT),
                "entries_with_samples": len(samples),
                "missing_entries": missing,
            },
            indent=2,
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
