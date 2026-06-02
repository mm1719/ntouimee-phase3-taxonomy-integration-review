import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsv, splitCell } from "../utils/csv";
import type { Candidate, InvalidLabelData, SampleMap, TreeNode } from "../types";

const dataPath = (...parts: string[]) => resolve(process.cwd(), "public", "data", ...parts);

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(dataPath(name), "utf-8")) as T;
}

function readText(name: string): string {
  return readFileSync(dataPath(name), "utf-8");
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

  it("keeps summary counts aligned with candidate rows and tree placements", () => {
    const selectedIds = new Set<string>();
    let placementCount = 0;
    let candidateImageCount = 0;

    candidates.forEach((candidate) => {
      const ids = splitCell(candidate.selected_aphia_ids);
      expect(ids.length, candidate.entry_id).toBeGreaterThan(0);
      ids.forEach((id) => selectedIds.add(id));
      placementCount += ids.length;
      candidateImageCount += Number(candidate.image_count);
    });

    expect(candidates).toHaveLength(tree.dataset_class_entry_count);
    expect(selectedIds.size).toBe(tree.unique_selected_aphia_id_count);
    expect(placementCount).toBe(tree.entry_count);
    expect(candidateImageCount).toBe(tree.unique_candidate_image_count);
  });

  it("has unique candidate ids and every tree dataset-class leaf points to one", () => {
    const candidateIds = new Set(candidates.map((candidate) => candidate.entry_id));
    expect(candidateIds.size).toBe(candidates.length);

    const leafEntryIds: string[] = [];
    visitTree(tree, (node) => {
      if (node.type !== "dataset_class") return;
      expect(node.entry_id).toBeTruthy();
      expect(candidateIds.has(node.entry_id!)).toBe(true);
      leafEntryIds.push(node.entry_id!);
    });

    expect(leafEntryIds).toHaveLength(tree.entry_count);
  });

  it("keeps sample maps and lineage maps referentially valid", () => {
    const candidateIds = new Set(candidates.map((candidate) => candidate.entry_id));
    const selectedIds = new Set(
      candidates.flatMap((candidate) => splitCell(candidate.selected_aphia_ids))
    );

    Object.entries(samples).forEach(([entryId, sampleRows]) => {
      expect(candidateIds.has(entryId), entryId).toBe(true);
      expect(sampleRows.length, entryId).toBeLessThanOrEqual(15);
      sampleRows.forEach((sample) => {
        expect(sample.thumbnail_url).toMatch(/^\/samples\//);
        expect(sample.source_ref).not.toMatch(/^\/home\//);
      });
    });

    selectedIds.forEach((aphiaId) => {
      expect(lineages[aphiaId], aphiaId).toBeTruthy();
    });
  });
});

describe("invalid route public data contract", () => {
  const invalid = readJson<InvalidLabelData>("invalid_label_groups.json");

  it("keeps table counts and total image count aligned with grouped rows", () => {
    const nonTaxonomic = invalid.tables.non_taxonomic_category;
    const mismatch = invalid.tables.taxonomic_mismatch;

    expect(nonTaxonomic).toHaveLength(invalid.summary.table_counts.non_taxonomic_category);
    expect(mismatch).toHaveLength(invalid.summary.table_counts.taxonomic_mismatch);

    const tableImageCount = [...nonTaxonomic, ...mismatch].reduce(
      (sum, group) => sum + group.total_image_count,
      0
    );
    expect(tableImageCount).toBe(invalid.summary.total_image_count);
  });

  it("keeps invalid aliases grouped uniquely within each table", () => {
    Object.values(invalid.tables).forEach((groups) => {
      const keys = new Set<string>();
      groups.forEach((group) => {
        expect(keys.has(group.sample_key), group.sample_key).toBe(false);
        keys.add(group.sample_key);
        expect(group.aliases.length).toBeGreaterThan(0);
        expect(group.datasets.length).toBeGreaterThan(0);
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
      sampleRows.forEach((sample) => {
        expect(sample.thumbnail_url).toMatch(/^\/invalid-samples\//);
        expect(sample.source_ref).not.toMatch(/^\/home\//);
      });
    });
  });
});
