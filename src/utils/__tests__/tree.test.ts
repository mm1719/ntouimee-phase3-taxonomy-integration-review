import { describe, expect, it } from "vitest";
import type { TreeNode } from "../../types";
import { collectRanks, filterTree, normalizeTree, shouldDefaultOpen } from "../tree";

const tree: TreeNode = {
  type: "root",
  name: "Root",
  image_count: 0,
  entry_count: 0,
  children: [
    {
      type: "taxon",
      name: "Animalia",
      rank: "Kingdom",
      aphia_id: "2",
      image_count: 0,
      entry_count: 0,
      children: [
        {
          type: "taxon",
          name: "Crustacea",
          rank: "Subphylum",
          aphia_id: "1066",
          image_count: 0,
          entry_count: 0,
          children: [
            {
              type: "dataset_class",
              name: "Crustacea broad",
              entry_id: "tara_pacific_deck::Crustacea broad",
              dataset_id: "tara_pacific_deck",
              selected_aphia_id: "1066",
              rank: "Subphylum",
              image_count: 10,
              entry_count: 1,
              risk_flags: ["broad_class"]
            }
          ]
        },
        {
          type: "taxon",
          name: "Copepoda",
          rank: "Class",
          aphia_id: "1080",
          image_count: 0,
          entry_count: 0,
          children: [
            {
              type: "dataset_class",
              name: "Copepoda",
              entry_id: "flowcam_net::Copepoda",
              dataset_id: "flowcam_net",
              selected_aphia_id: "1080",
              rank: "Class",
              image_count: 5,
              entry_count: 1,
              risk_flags: []
            }
          ]
        }
      ]
    }
  ]
};

const allFilters = {
  queries: ["", "", ""],
  datasets: new Set(["flowcam_net", "tara_pacific_deck"] as const),
  risks: new Set<string>(),
  rank: ""
};

describe("normalizeTree", () => {
  it("rolls up dataset ids, risks, and lineage notes from descendants", () => {
    const normalized = normalizeTree(tree);

    expect(normalized.datasets?.sort()).toEqual(["flowcam_net", "tara_pacific_deck"]);
    expect(normalized.risk_flags).toContain("broad_class");
    expect(normalized.children?.[0].datasets?.sort()).toEqual([
      "flowcam_net",
      "tara_pacific_deck"
    ]);
  });
});

describe("filterTree", () => {
  it("returns no tree for an unknown search query instead of preserving stale data", () => {
    const result = filterTree(normalizeTree(tree), { ...allFilters, queries: ["not-in-tree", "", ""] });

    expect(result).toEqual([]);
  });

  it("keeps descendants when the query matches an ancestor taxon", () => {
    const result = filterTree(normalizeTree(tree), { ...allFilters, queries: ["animalia", "", ""] });

    expect(result[0].entry_count).toBe(2);
    expect(result[0].children?.[0].children?.map((child) => child.name)).toEqual([
      "Crustacea",
      "Copepoda"
    ]);
  });

  it("uses OR semantics across multiple search terms", () => {
    const result = filterTree(normalizeTree(tree), { ...allFilters, queries: ["missing", "copepoda", ""] });

    expect(JSON.stringify(result)).toContain("flowcam_net::Copepoda");
    expect(JSON.stringify(result)).not.toContain("Crustacea broad");
  });

  it("filters by dataset and risk flags at dataset-class level", () => {
    const result = filterTree(normalizeTree(tree), {
      ...allFilters,
      datasets: new Set(["tara_pacific_deck"]),
      risks: new Set(["broad_class"])
    });

    expect(result[0].entry_count).toBe(1);
    expect(JSON.stringify(result)).toContain("Crustacea broad");
    expect(JSON.stringify(result)).not.toContain("flowcam_net::Copepoda");
  });
});

describe("rank helpers", () => {
  it("collects taxon ranks and applies default-open depth rules", () => {
    expect(collectRanks(tree)).toEqual(["Class", "Kingdom", "Subphylum"]);
    expect(shouldDefaultOpen(tree, 0)).toBe(true);
    expect(shouldDefaultOpen(tree.children![0], 1)).toBe(true);
    expect(shouldDefaultOpen(tree.children![0].children![0], 3)).toBe(false);
  });
});
