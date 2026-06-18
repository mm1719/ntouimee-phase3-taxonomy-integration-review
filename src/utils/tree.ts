import type { DatasetId, TreeNode } from "../types";

export type Filters = {
  queries: string[];
  datasets: Set<DatasetId>;
  risks: Set<string>;
  rank: string;
};

export function normalizeTree(node: TreeNode): TreeNode {
  const children = (node.children ?? []).map(normalizeTree);
  if (node.type === "dataset_class") {
    const dataset = node.dataset_id ? [node.dataset_id] : [];
    return {
      ...node,
      children,
      entry_count: node.entry_count ?? 1,
      datasets: node.datasets ?? dataset,
      risk_flags: node.risk_flags ?? [],
      special_tags: node.special_tags ?? [],
      lineage_notes: node.lineage_notes ?? []
    };
  }
  return {
    ...node,
    children,
    entry_count: node.entry_count ?? children.reduce((sum, child) => sum + (child.entry_count ?? 0), 0),
    datasets: node.datasets ?? ([...new Set(children.flatMap((child) => child.datasets ?? []))] as DatasetId[]),
    risk_flags: node.risk_flags ?? [...new Set(children.flatMap((child) => child.risk_flags ?? []))],
    special_tags: node.special_tags ?? [...new Set(children.flatMap((child) => child.special_tags ?? []))],
    lineage_notes: node.lineage_notes ?? [...new Set(children.flatMap((child) => child.lineage_notes ?? []))]
  };
}

function nodeText(node: TreeNode): string {
  return [
    node.name,
    node.rank,
    node.aphia_id,
    node.entry_id,
    node.dataset_id,
    node.selected_aphia_id
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function normalizedQueries(filters: Filters): string[] {
  return filters.queries
    .map((query) => query.trim().toLowerCase())
    .filter(Boolean);
}

function queryMatches(text: string, filters: Filters): boolean {
  const queries = normalizedQueries(filters);
  return queries.length === 0 || queries.some((query) => text.includes(query));
}

function leafMatches(node: TreeNode, filters: Filters, ignoreQuery = false): boolean {
  if (node.type !== "dataset_class") return false;
  if (node.dataset_id && !filters.datasets.has(node.dataset_id)) return false;
  if (filters.risks.size > 0) {
    const tagsAndRisks = new Set([...(node.risk_flags ?? []), ...(node.special_tags ?? [])]);
    if (![...filters.risks].some((risk) => tagsAndRisks.has(risk))) return false;
  }
  if (filters.rank && node.rank !== filters.rank) return false;
  if (!ignoreQuery && !queryMatches(nodeText(node), filters)) {
    return false;
  }
  return true;
}

function taxonMatches(node: TreeNode, filters: Filters, ignoreQuery = false): boolean {
  if (filters.rank && node.rank !== filters.rank) return false;
  if (!ignoreQuery && !queryMatches(nodeText(node), filters)) {
    return false;
  }
  return true;
}

function mergeNode(node: TreeNode, children: TreeNode[]): TreeNode {
  const image_count = children.reduce((sum, child) => sum + child.image_count, 0);
  const entry_count = children.reduce((sum, child) => sum + (child.entry_count ?? 0), 0);
  const datasets = [...new Set(children.flatMap((child) => child.datasets ?? []))] as DatasetId[];
  const risk_flags = [...new Set(children.flatMap((child) => child.risk_flags ?? []))];
  const special_tags = [...new Set(children.flatMap((child) => child.special_tags ?? []))];
  const lineage_notes = [...new Set(children.flatMap((child) => child.lineage_notes ?? []))];
  return { ...node, children, image_count, entry_count, datasets, risk_flags, special_tags, lineage_notes };
}

export function filterTree(node: TreeNode, filters: Filters, forceDescendants = false): TreeNode[] {
  const isLeaf = node.type === "dataset_class";
  const selfQueryMatch = !isLeaf && normalizedQueries(filters).length > 0 && queryMatches(nodeText(node), filters);
  const includeDescendants = forceDescendants || selfQueryMatch;
  const filteredChildren = (node.children ?? []).flatMap((child) =>
    filterTree(child, filters, includeDescendants)
  );
  const selfVisible = isLeaf
    ? leafMatches(node, filters, includeDescendants)
    : taxonMatches(node, filters, includeDescendants);
  if (isLeaf) return selfVisible ? [node] : [];

  if (filteredChildren.length === 0 && !selfVisible) return [];

  const merged = mergeNode(node, filteredChildren);
  return [merged];
}

export function shouldDefaultOpen(node: TreeNode, depth: number): boolean {
  if (node.type === "root") return true;
  return depth < 3;
}

export function collectRanks(node: TreeNode): string[] {
  const ranks = new Set<string>();
  const visit = (item: TreeNode) => {
    if (item.type === "taxon" && item.rank) ranks.add(item.rank);
    (item.children ?? []).forEach(visit);
  };
  visit(node);
  return [...ranks].sort();
}
