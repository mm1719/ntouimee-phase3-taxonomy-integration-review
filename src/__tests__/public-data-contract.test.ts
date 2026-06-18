import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { parseCsv, splitCell } from "../utils/csv";
import type { Candidate, InvalidLabelData, MappingStatusData, SampleMap, TreeNode } from "../types";

type DemoDataMetadata = {
  public_artifacts: Record<string, { path: string; sha256: string; bytes: number }>;
};

const dataPath = (...parts: string[]) => resolve(process.cwd(), "public", "data", ...parts);

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(dataPath(name), "utf-8")) as T;
}

function readText(name: string): string {
  return readFileSync(dataPath(name), "utf-8");
}

function sha256(name: string) {
  return createHash("sha256").update(readFileSync(dataPath(name))).digest("hex");
}

function visitTree(node: TreeNode, callback: (node: TreeNode) => void) {
  callback(node);
  node.children?.forEach((child) => visitTree(child, callback));
}

describe("valid route public data contract", () => {
  const tree = readJson<TreeNode>("taxonomy_tree.json");
  const candidates = parseCsv<Candidate>(readText("valid_class_candidates.csv"));
  const samples = readJson<SampleMap>("class_image_samples.json");
  const lineages = readJson<Record<string, unknown>>("worms_lineages.json");
  const metadata = readJson<DemoDataMetadata>("demo_data_metadata.json");
  const allowedSpecialTags = new Set(["dwc_record_review", "multiple", "juvenile"]);

  it("keeps summary counts aligned with candidate rows and tree placements", () => {
    const selectedIds = new Set<string>();
    let placementCount = 0;
    let candidateImageCount = 0;

    candidates.forEach((candidate) => {
      const ids = splitCell(candidate.selected_aphia_ids);
      expect(ids.length, candidate.entry_id).toBeGreaterThan(0);
      ids.forEach((id) => selectedIds.add(id));
      const aphiaImageCounts = splitCell(candidate.selected_aphia_image_counts).map(Number);
      expect(aphiaImageCounts, candidate.entry_id).toHaveLength(ids.length);
      expect(aphiaImageCounts.reduce((sum, count) => sum + count, 0), candidate.entry_id)
        .toBe(Number(candidate.image_count));
      if (ids.length > 1) {
        aphiaImageCounts.forEach((count) => expect(count, candidate.entry_id).toBeGreaterThan(0));
      }
      placementCount += ids.length;
      candidateImageCount += Number(candidate.image_count);
    });

    expect(candidates).toHaveLength(tree.dataset_class_entry_count);
    expect(selectedIds.size).toBe(tree.unique_selected_aphia_id_count);
    expect(placementCount).toBe(tree.entry_count);
    expect(candidateImageCount).toBe(tree.unique_candidate_image_count);
    expect(tree.image_count).toBe(tree.unique_candidate_image_count);
    expect(tree.placement_weighted_image_count).toBe(tree.unique_candidate_image_count);
  });

  it("has unique candidate ids and every tree dataset-class leaf points to one", () => {
    const candidateIds = new Set(candidates.map((candidate) => candidate.entry_id));
    expect(candidateIds.size).toBe(candidates.length);

    const candidateByEntry = new Map(candidates.map((candidate) => [candidate.entry_id, candidate]));
    const leafEntryIds: string[] = [];
    visitTree(tree, (node) => {
      if (node.type !== "dataset_class") return;
      expect(node.entry_id).toBeTruthy();
      expect(candidateIds.has(node.entry_id!)).toBe(true);
      const candidate = candidateByEntry.get(node.entry_id!)!;
      const selectedIds = splitCell(candidate.selected_aphia_ids);
      const aphiaCounts = splitCell(candidate.selected_aphia_image_counts).map(Number);
      const treeAphiaId = node.aphia_id ?? node.selected_aphia_id;
      if (treeAphiaId) {
        const index = selectedIds.indexOf(treeAphiaId);
        expect(index, node.entry_id).toBeGreaterThanOrEqual(0);
        expect(node.image_count, node.entry_id).toBe(aphiaCounts[index]);
      }
      leafEntryIds.push(node.entry_id!);
    });

    expect(leafEntryIds).toHaveLength(tree.entry_count);
  });

  it("keeps sample maps, lineage maps, and metadata referentially valid", () => {
    const candidateIds = new Set(candidates.map((candidate) => candidate.entry_id));
    const candidateById = new Map(candidates.map((candidate) => [candidate.entry_id, candidate]));
    const selectedIds = new Set(
      candidates.flatMap((candidate) => splitCell(candidate.selected_aphia_ids))
    );

    Object.entries(samples).forEach(([entryId, sampleRows]) => {
      const [baseEntryId, aphiaId] = entryId.split("::aphia::");
      expect(candidateIds.has(baseEntryId), entryId).toBe(true);
      if (aphiaId) {
        expect(splitCell(candidateById.get(baseEntryId)?.selected_aphia_ids ?? ""), entryId).toContain(aphiaId);
      }
      expect(sampleRows.length, entryId).toBeLessThanOrEqual(8);
      sampleRows.forEach((sample) => {
        expect(sample.thumbnail_url).toMatch(/^\/samples\//);
        expect(sample.source_ref).not.toMatch(/^\/home\//);
      });
    });

    selectedIds.forEach((aphiaId) => {
      expect(lineages[aphiaId], aphiaId).toBeTruthy();
    });

    for (const name of [
      "taxonomy_tree.json",
      "valid_class_candidates.csv",
      "class_image_samples.json",
      "invalid_label_groups.json",
      "mapping_status.json",
      "worms_lineages.json"
    ]) {
      expect(metadata.public_artifacts[name]?.sha256, name).toBe(sha256(name));
    }
  });

  it("keeps special tags separate from risk flags", () => {
    let specialTagCount = 0;

    candidates.forEach((candidate) => {
      const riskFlags = splitCell(candidate.risk_flags);
      const specialTags = splitCell(candidate.special_tags);

      expect(riskFlags, candidate.entry_id).not.toContain("dwc_record_review");
      specialTags.forEach((tag) => {
        expect(allowedSpecialTags.has(tag), `${candidate.entry_id}: ${tag}`).toBe(true);
        specialTagCount += 1;
      });
    });

    expect(specialTagCount).toBeGreaterThan(0);
  });
});

describe("invalid route public data contract", () => {
  const invalid = readJson<InvalidLabelData>("invalid_label_groups.json");

  it("keeps table counts and image-count semantics aligned with grouped rows", () => {
    const nonTaxonomic = invalid.tables.non_taxonomic_category;
    const mismatch = invalid.tables.taxonomic_mismatch;

    expect(invalid.summary.excluded_valid_tree_overlap_default).toBe(false);

    expect(nonTaxonomic).toHaveLength(invalid.summary.table_counts.non_taxonomic_category);
    expect(mismatch).toHaveLength(invalid.summary.table_counts.taxonomic_mismatch);

    const tableImageCount = [...nonTaxonomic, ...mismatch].reduce(
      (sum, group) => sum + group.total_image_count,
      0
    );
    expect(tableImageCount).toBe(invalid.summary.evidence_table_total_image_count);

    const uniqueDatasetGroupCounts = new Map<string, number>();
    [...nonTaxonomic, ...mismatch].forEach((group) => {
      group.datasets.forEach((dataset) => {
        const key = `${dataset.dataset_id}::${group.group_key}`;
        const previous = uniqueDatasetGroupCounts.get(key);
        if (previous === undefined) {
          uniqueDatasetGroupCounts.set(key, dataset.image_count);
        } else {
          expect(previous, key).toBe(dataset.image_count);
        }
      });
    });
    const uniqueInvalidImageCount = Array.from(uniqueDatasetGroupCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    expect(invalid.summary.total_image_count_semantics).toBe(
      "unique_dataset_invalid_group_image_union"
    );
    expect(uniqueInvalidImageCount).toBe(invalid.summary.total_image_count);
  });

  it("keeps invalid aliases grouped uniquely within each table", () => {
    Object.values(invalid.tables).forEach((groups) => {
      const keys = new Set<string>();
      groups.forEach((group) => {
        expect(keys.has(group.sample_key), group.sample_key).toBe(false);
        keys.add(group.sample_key);
        expect(group.aliases.length).toBeGreaterThan(0);
        expect(group.pseudo_aphia_id, group.sample_key).toMatch(/^(ntc|tm|inv)_\d{3}$/);
        expect(group.datasets.length).toBeGreaterThan(0);
        expect(group.invalid_reason_count ?? 0).toBeGreaterThan(0);
        group.datasets.forEach((dataset) => {
          expect(dataset.reasons.length).toBeGreaterThan(0);
          expect(dataset.invalid_reason_count ?? 0).toBe(dataset.reasons.length);
          if (dataset.valid_tree_entry === "yes") {
            expect(dataset.valid_image_count ?? 0).toBe(dataset.image_count);
            expect(dataset.invalid_image_count ?? 0).toBe(dataset.image_count);
          }
        });
      });
    });
  });

  it("keeps invalid sample references capped and linked to table groups", () => {
    const groupKeys = new Set(
      [...invalid.tables.non_taxonomic_category, ...invalid.tables.taxonomic_mismatch].map(
        (group) => group.sample_key
      )
    );

    Object.entries(invalid.samples).forEach(([sampleKey, sampleRows]) => {
      expect(groupKeys.has(sampleKey), sampleKey).toBe(true);
      expect(sampleRows.length, sampleKey).toBeGreaterThan(0);
      const byDatasetLabel = new Map<string, number>();
      sampleRows.forEach((sample) => {
        const countKey = `${sample.dataset_id}::${sample.label}`;
        byDatasetLabel.set(countKey, (byDatasetLabel.get(countKey) ?? 0) + 1);
        expect(sample.thumbnail_url).toMatch(/^\/invalid-samples\//);
        expect(sample.source_ref).not.toMatch(/^\/home\//);
      });
      byDatasetLabel.forEach((count, countKey) => {
        expect(count, `${sampleKey} ${countKey}`).toBeLessThanOrEqual(invalid.summary.sample_limit_per_dataset);
      });
    });
  });
});

describe("mapping status public data contract", () => {
  const mapping = readJson<MappingStatusData>("mapping_status.json");

  it("keeps mapping histories aligned with current target IDs", () => {
    const targetIds = new Set(mapping.targets.map((target) => target.source_id));
    expect(mapping.target_count).toBe(mapping.targets.length);
    expect(mapping.histories.length).toBeGreaterThan(0);
    expect(mapping.latest_history_id).toBe(mapping.histories.at(-1)?.history_id);

    mapping.histories.forEach((history) => {
      expect(history.rows).toHaveLength(mapping.targets.length);
      const sourceIds = new Set<string>();
      history.rows.forEach((row) => {
        expect(targetIds.has(row.source_id), row.source_id).toBe(true);
        expect(sourceIds.has(row.source_id), row.source_id).toBe(false);
        sourceIds.add(row.source_id);
        expect(["keep", "merge", "drop"]).toContain(row.action);
        if (row.action === "merge") {
          expect(row.target_id, row.source_id).toBeTruthy();
          expect(row.target_id, row.source_id).not.toBe(row.source_id);
          expect(targetIds.has(row.target_id), row.source_id).toBe(row.validation_status === "ok");
        } else {
          expect(row.target_id, row.source_id).toBe("");
          expect(row.target_alias, row.source_id).toBe("");
        }
      });
    });
  });
});
