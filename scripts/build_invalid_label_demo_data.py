#!/usr/bin/env python3
"""Build invalid-label review data and thumbnails for the taxonomy demo."""

from __future__ import annotations

import csv
import hashlib
import json
import re
import shutil
from collections import defaultdict
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps


SCRIPT_DIR = Path(__file__).resolve().parent
DEMO_ROOT = SCRIPT_DIR.parent
ROOT = SCRIPT_DIR.parents[2]
INVALID_CSV = ROOT / "studies/label_aphia_inventory/worms_invalid_labels_for_review.csv"
OUT_DIR = ROOT / "studies/invalid_label_visualization"
OUT_JSON = OUT_DIR / "invalid_label_groups.json"
DEMO_JSON = DEMO_ROOT / "public/data/invalid_label_groups.json"
OUT_DUPLICATE_CSV = OUT_DIR / "invalid_duplicate_evidence_image_groups.csv"
OUT_DUPLICATE_MD = OUT_DIR / "invalid_duplicate_evidence_image_groups.md"
SAMPLES_DIR = DEMO_ROOT / "public/invalid-samples"
SAMPLE_LIMIT_PER_DATASET = 8
THUMBNAIL_MAX_EDGE = 256

STATUS_KEYS = {
    "Non-Taxonomic Category": "non_taxonomic_category",
    "Taxonomic Mismatch": "taxonomic_mismatch",
}
CLEANUP_DECISIONS_CSV = (
    ROOT / "studies/label_aphia_inventory/invalid_label_cleanup_decisions.csv"
)
INVALID_PSEUDO_REGISTRY = ROOT / "derived/ml_ready/invalid_pseudo_aphia_id_map.csv"

DATASET_ORDER = [
    "life_watch",
    "life_watch_2026_image_library",
    "flowcam_net",
    "tara_pacific_deck",
    "tara_pacific_bongo",
    "ifremer_srn",
]

MANIFESTS = {
    "life_watch": {
        "path": ROOT / "derived/analysis_ready/life_watch/image_level_manifest.csv",
        "label": "label_original",
        "image_path": "source_path",
        "image_id": "image_id",
        "width": "width",
        "height": "height",
    },
    "life_watch_2026_image_library": {
        "path": ROOT / "derived/analysis_ready/life_watch_2026_image_library/manifest.csv",
        "label": "label_original",
        "image_path": "source_path",
        "image_id": "image_id",
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


def label_key(value: str) -> str:
    return re.sub(r"[\s_]+", " ", value.strip().casefold())


def registry_label_key(value: str) -> str:
    text = value.strip().lower().replace("_", " ")
    return re.sub(r"\s+", " ", text)


def split_cell(value: str) -> list[str]:
    return [item for item in value.split("|") if item]


def load_invalid_alias_keys() -> dict[str, str]:
    if not CLEANUP_DECISIONS_CSV.exists():
        return {}
    alias_keys: dict[str, str] = {}
    with CLEANUP_DECISIONS_CSV.open("r", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            if row.get("decision_type") != "invalid_alias_group":
                continue
            if row.get("review_status") != "accepted":
                continue
            if row.get("applies_to_demo") != "yes":
                continue
            aliases = split_cell(row.get("alias_group", ""))
            if not aliases:
                continue
            canonical = row.get("canonical_label") or aliases[0]
            canonical_key = label_key(canonical)
            for alias in aliases:
                alias_keys[label_key(alias)] = canonical_key
            for alias in split_cell(row.get("source_label", "")):
                alias_keys[label_key(alias)] = canonical_key
    return alias_keys


INVALID_ALIAS_KEYS = load_invalid_alias_keys()

def load_promoted_invalid_review_keys() -> set[tuple[str, str]]:
    if not CLEANUP_DECISIONS_CSV.exists():
        return set()
    promoted: set[tuple[str, str]] = set()
    with CLEANUP_DECISIONS_CSV.open("r", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            if row.get("review_status") != "accepted":
                continue
            if row.get("applies_to_invalid_review") != "remove_promoted_row":
                continue
            for dataset_id in split_cell(row.get("dataset_id", "")):
                promoted.add((dataset_id, label_key(row.get("source_label", ""))))
    return promoted


PROMOTED_INVALID_REVIEW_KEYS = load_promoted_invalid_review_keys()


def load_pseudo_aphia_ids() -> dict[str, str]:
    if not INVALID_PSEUDO_REGISTRY.exists():
        return {}
    pseudo_by_alias_key: dict[str, str] = {}
    with INVALID_PSEUDO_REGISTRY.open("r", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            if row.get("registry_status") != "active":
                continue
            key = row.get("normalized_alias_key", "")
            pseudo_id = row.get("pseudo_aphia_id", "")
            if key and pseudo_id:
                pseudo_by_alias_key[key] = pseudo_id
            group_key = row.get("invalid_group_key", "")
            if group_key and pseudo_id:
                for item in split_cell(group_key):
                    pseudo_by_alias_key[registry_label_key(item)] = pseudo_id
            for alias in split_cell(row.get("source_aliases", "")):
                pseudo_by_alias_key[registry_label_key(alias)] = pseudo_id
    return pseudo_by_alias_key

def invalid_group_key(value: str) -> str:
    key = label_key(value)
    return INVALID_ALIAS_KEYS.get(key, key)


def alias_sort_key(value: str) -> tuple[str, list[int], str]:
    return (
        value.casefold(),
        [0 if char.islower() else 1 if char.isupper() else 0 for char in value],
        value,
    )


def safe_segment(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", value.strip())
    return cleaned.strip("._")[:96] or "unknown"



def unique_sorted(values: list[str]) -> list[str]:
    return sorted(set(filter(None, values)), key=alias_sort_key)


def normalized_alias_key(aliases: list[str]) -> str:
    return "|".join(sorted({registry_label_key(alias) for alias in aliases if alias}))


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


def read_invalid_rows() -> list[dict[str, str]]:
    with INVALID_CSV.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    return [
        row
        for row in rows
        if (row["dataset_id"], label_key(row["label"]))
        not in PROMOTED_INVALID_REVIEW_KEYS
    ]


def reason_matches_status(reason: str, status: str) -> bool:
    if status == "Taxonomic Mismatch":
        return "AphiaID " in reason or " resolves to " in reason
    if status == "Non-Taxonomic Category":
        return (
            "Strict rule:" in reason
            or "No local AphiaID" in reason
            or "non-numeric/non-AphiaID" in reason
        )
    return True


def status_reasons(row: dict[str, str], status: str) -> list[str]:
    reasons = split_cell(row.get("reasons", ""))
    matched = [reason for reason in reasons if reason_matches_status(reason, status)]
    return matched or reasons


def build_manifest_counts(
    invalid_rows: list[dict[str, str]],
) -> dict[tuple[str, str], int]:
    wanted: dict[str, set[str]] = defaultdict(set)
    for row in invalid_rows:
        wanted[row["dataset_id"]].add(label_key(row["label"]))

    counts: dict[tuple[str, str], int] = defaultdict(int)
    for dataset_id, cfg in MANIFESTS.items():
        if dataset_id not in wanted:
            continue
        with cfg["path"].open("r", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                key = label_key(row.get(cfg["label"], ""))
                if key in wanted[dataset_id]:
                    counts[(dataset_id, invalid_group_key(row.get(cfg["label"], "")))] += 1
    return counts


def write_thumbnail(source: Path, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        image.thumbnail((THUMBNAIL_MAX_EDGE, THUMBNAIL_MAX_EDGE), Image.Resampling.LANCZOS)
        if image.mode not in {"RGB", "L"}:
            image = image.convert("RGB")
        image.save(output, format="JPEG", quality=82, optimize=True)


def build_samples(
    invalid_rows: list[dict[str, str]],
    sample_keys: dict[tuple[str, str], list[str]],
) -> dict[str, list[dict[str, str]]]:
    wanted: dict[str, set[str]] = defaultdict(set)
    label_to_sample_keys: dict[tuple[str, str], list[str]] = defaultdict(list)
    for row in invalid_rows:
        dataset_id = row["dataset_id"]
        key = label_key(row["label"])
        group_key = invalid_group_key(row["label"])
        wanted[dataset_id].add(key)
        for status in split_cell(row["invalid_statuses"]):
            status_key = STATUS_KEYS.get(status)
            if status_key:
                label_to_sample_keys[(dataset_id, key)].append(f"{status_key}::{group_key}")

    if SAMPLES_DIR.exists():
        shutil.rmtree(SAMPLES_DIR)
    samples: dict[str, list[dict[str, str]]] = defaultdict(list)
    per_dataset_counts: dict[tuple[str, str, str], int] = defaultdict(int)

    for dataset_id, cfg in MANIFESTS.items():
        if dataset_id not in wanted:
            continue
        with cfg["path"].open("r", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                label = row.get(cfg["label"], "")
                key = label_key(label)
                if key not in wanted[dataset_id]:
                    continue
                target_sample_keys = label_to_sample_keys[(dataset_id, key)]
                if all(
                    per_dataset_counts[(sample_key, dataset_id, key)]
                    >= SAMPLE_LIMIT_PER_DATASET
                    for sample_key in target_sample_keys
                ):
                    continue

                source_value = row.get(cfg["image_path"], "")
                source_path = Path(source_value)
                if not source_path.is_absolute():
                    source_path = ROOT / source_path
                if not source_path.exists():
                    continue

                for sample_key in target_sample_keys:
                    counter_key = (sample_key, dataset_id, key)
                    if per_dataset_counts[counter_key] >= SAMPLE_LIMIT_PER_DATASET:
                        continue
                    sample_index = per_dataset_counts[counter_key] + 1
                    digest = hashlib.sha1(
                        f"{sample_key}:{dataset_id}:{row.get(cfg['image_id'], '')}:{source_value}:{sample_index}".encode(
                            "utf-8"
                        )
                    ).hexdigest()[:10]
                    output_rel = (
                        Path("invalid-samples")
                        / safe_segment(sample_key.split("::", 1)[0])
                        / safe_segment(dataset_id)
                        / safe_segment(key)
                        / f"{sample_index:02d}_{digest}.jpg"
                    )
                    output_path = DEMO_ROOT / "public" / output_rel
                    try:
                        write_thumbnail(source_path, output_path)
                    except Exception:
                        continue
                    samples[sample_key].append(
                        {
                            "dataset_id": dataset_id,
                            "label": label,
                            "image_id": row.get(cfg["image_id"], ""),
                            "thumbnail_url": "/" + str(output_rel),
                            "source_ref": relative_ref(source_value),
                            "width": row.get(cfg["width"], ""),
                            "height": row.get(cfg["height"], ""),
                        }
                    )
                    per_dataset_counts[counter_key] += 1
    return dict(sorted(samples.items()))


def build_groups(rows: list[dict[str, str]]) -> dict[str, Any]:
    manifest_counts = build_manifest_counts(rows)
    pseudo_aphia_ids = load_pseudo_aphia_ids()
    grouped: dict[str, dict[str, dict[str, Any]]] = {
        key: {} for key in STATUS_KEYS.values()
    }
    sample_keys: dict[tuple[str, str], list[str]] = defaultdict(list)

    for row in rows:
        label = row["label"]
        key = invalid_group_key(label)
        dataset_id = row["dataset_id"]
        statuses = split_cell(row["invalid_statuses"])
        for status in statuses:
            status_key = STATUS_KEYS.get(status)
            if not status_key:
                continue
            group = grouped[status_key].setdefault(
                key,
                {
                    "group_key": key,
                    "sample_key": f"{status_key}::{key}",
                    "aliases": [],
                    "status": status,
                    "dataset_ids": [],
                    "total_image_count": 0,
                    "include_valid_tree_overlap": row.get("valid_tree_entry") == "yes",
                    "invalid_reason_count": 0,
                    "valid_image_count": 0,
                    "invalid_image_count": 0,
                    "datasets": {},
                },
            )
            group["aliases"].append(label)
            group["include_valid_tree_overlap"] = (
                group["include_valid_tree_overlap"]
                or row.get("valid_tree_entry") == "yes"
            )
            group["dataset_ids"].append(dataset_id)
            dataset = group["datasets"].setdefault(
                dataset_id,
                {
                    "dataset_id": dataset_id,
                    "aliases": [],
                    "image_count": 0,
                    "reasons": [],
                    "source_examples": [],
                    "worms_sources": [],
                    "valid_tree_entry": row.get("valid_tree_entry", "no"),
                    "invalid_reason_count": 0,
                    "valid_image_count": 0,
                    "invalid_image_count": 0,
                },
            )
            dataset["aliases"].append(label)
            dataset["reasons"].extend(status_reasons(row, status))
            dataset["source_examples"].extend(split_cell(row.get("source_example", "")))
            dataset["worms_sources"].extend(split_cell(row.get("worms_sources", "")))
            dataset["valid_tree_entry"] = (
                "yes"
                if dataset["valid_tree_entry"] == "yes"
                or row.get("valid_tree_entry") == "yes"
                else "no"
            )
            sample_keys[(status_key, key)].append(f"{status_key}::{key}")

    for status_key, table in grouped.items():
        for group in table.values():
            total = 0
            group["aliases"] = unique_sorted(group["aliases"])
            group["dataset_ids"] = [
                dataset_id
                for dataset_id in DATASET_ORDER
                if dataset_id in set(group["dataset_ids"])
            ]
            datasets = []
            for dataset_id in DATASET_ORDER:
                if dataset_id not in group["datasets"]:
                    continue
                dataset = group["datasets"][dataset_id]
                count = manifest_counts.get((dataset_id, group["group_key"]), 0)
                dataset["image_count"] = count
                dataset["invalid_image_count"] = count
                dataset["valid_image_count"] = count if dataset["valid_tree_entry"] == "yes" else 0
                total += count
                dataset["aliases"] = unique_sorted(dataset["aliases"])
                dataset["reasons"] = unique_sorted(dataset["reasons"])
                dataset["source_examples"] = unique_sorted(dataset["source_examples"])
                dataset["worms_sources"] = unique_sorted(dataset["worms_sources"])
                dataset["invalid_reason_count"] = len(dataset["reasons"])
                datasets.append(dataset)
            group["total_image_count"] = total
            group["pseudo_aphia_id"] = pseudo_aphia_ids.get(
                normalized_alias_key(group["aliases"]),
                pseudo_aphia_ids.get(registry_label_key(group["group_key"]), ""),
            )
            group["invalid_image_count"] = sum(dataset["invalid_image_count"] for dataset in datasets)
            group["valid_image_count"] = sum(dataset["valid_image_count"] for dataset in datasets)
            group["invalid_reason_count"] = len(
                unique_sorted(
                    [
                        reason
                        for dataset in datasets
                        for reason in dataset["reasons"]
                    ]
                )
            )
            group["datasets"] = datasets

    tables = {
        status_key: sorted(
            table.values(),
            key=lambda group: alias_sort_key(group["aliases"][0] if group["aliases"] else group["group_key"]),
        )
        for status_key, table in grouped.items()
    }
    table_image_counts = {
        key: sum(group["total_image_count"] for group in value)
        for key, value in tables.items()
    }
    unique_invalid_image_count = sum(
        manifest_counts.get(group_key, 0)
        for group_key in set(manifest_counts)
    )
    unique_group_keys = {
        group["group_key"]
        for table in tables.values()
        for group in table
    }
    samples = build_samples(rows, sample_keys)
    data = {
        "tables": tables,
        "samples": samples,
        "summary": {
            "source": str(INVALID_CSV),
            "sample_limit_per_dataset": SAMPLE_LIMIT_PER_DATASET,
            "excluded_valid_tree_overlap_default": False,
            "table_counts": {
                key: len(value)
                for key, value in tables.items()
            },
            "table_image_counts": table_image_counts,
            "evidence_table_total_group_count": sum(len(value) for value in tables.values()),
            "evidence_table_total_image_count": sum(table_image_counts.values()),
            "unique_group_count": len(unique_group_keys),
            "total_image_count": unique_invalid_image_count,
            "total_image_count_semantics": "unique_dataset_invalid_group_image_union",
        },
    }
    write_duplicate_evidence_report(data)
    return data


def write_duplicate_evidence_report(data: dict[str, Any]) -> None:
    by_dataset_group: dict[tuple[str, str], dict[str, Any]] = {}
    for table_key, groups in data["tables"].items():
        for group in groups:
            for dataset in group["datasets"]:
                key = (dataset["dataset_id"], group["group_key"])
                item = by_dataset_group.setdefault(
                    key,
                    {
                        "dataset_id": dataset["dataset_id"],
                        "group_key": group["group_key"],
                        "image_count": dataset["image_count"],
                        "tables": set(),
                        "aliases": set(),
                    },
                )
                item["tables"].add(table_key)
                item["aliases"].update(group["aliases"])

    duplicates = [
        item for item in by_dataset_group.values()
        if len(item["tables"]) > 1
    ]
    duplicates.sort(key=lambda item: (-int(item["image_count"]), item["dataset_id"], item["group_key"]))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with OUT_DUPLICATE_CSV.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["dataset_id", "group_key", "image_count", "tables", "aliases"],
        )
        writer.writeheader()
        for item in duplicates:
            writer.writerow(
                {
                    "dataset_id": item["dataset_id"],
                    "group_key": item["group_key"],
                    "image_count": item["image_count"],
                    "tables": "|".join(sorted(item["tables"])),
                    "aliases": "|".join(unique_sorted(list(item["aliases"]))),
                }
            )

    duplicate_images = sum(int(item["image_count"]) for item in duplicates)
    lines = [
        "# Invalid Duplicate Evidence Image Groups",
        "",
        "These rows explain the gap between invalid evidence-table image totals and unique invalid image totals in the demo. Each listed dataset/group appears in both invalid tables, so its images are counted once in each evidence table but once in the unique demo total.",
        "",
        f"- Duplicate dataset/group entries: {len(duplicates):,}",
        f"- Duplicate image count: {duplicate_images:,}",
        "",
        "| Dataset | Group | Images | Tables | Aliases |",
        "| --- | --- | ---: | --- | --- |",
    ]
    for item in duplicates:
        lines.append(
            "| `{dataset}` | {group} | {count:,} | `{tables}` | {aliases} |".format(
                dataset=item["dataset_id"],
                group=str(item["group_key"]).replace("|", "\\|"),
                count=int(item["image_count"]),
                tables="|".join(sorted(item["tables"])).replace("|", "\\|"),
                aliases=", ".join(unique_sorted(list(item["aliases"]))).replace("|", "\\|"),
            )
        )
    OUT_DUPLICATE_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    rows = read_invalid_rows()
    data = build_groups(rows)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    DEMO_JSON.parent.mkdir(parents=True, exist_ok=True)
    DEMO_JSON.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "study_json": str(OUT_JSON),
                "demo_json": str(DEMO_JSON),
                "table_counts": data["summary"]["table_counts"],
                "sample_groups": len(data["samples"]),
            },
            indent=2,
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
