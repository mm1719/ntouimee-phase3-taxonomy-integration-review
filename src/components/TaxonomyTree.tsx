import { ChevronRight } from "lucide-react";
import { DatasetBadge, NoteBadge, RiskBadge } from "./Badges";
import { shouldDefaultOpen } from "../utils/tree";
import type { TreeNode } from "../types";

type Props = {
  node: TreeNode;
  onSelect: (node: TreeNode) => void;
};

export function TaxonomyTree({ node, onSelect }: Props) {
  const children = node.children ?? [];
  const isLeaf = node.type === "dataset_class";
  const terminalPlacements = children.filter((child) => child.type === "dataset_class");
  const taxonChildren = children.filter((child) => child.type !== "dataset_class");
  const hasFinerDescendants = taxonChildren.length > 0;
  const size = Math.max(8, Math.min(26, 8 + Math.sqrt(Math.max(0, node.image_count)) / 45));

  const content = (
    <div className="node-row" onClick={() => onSelect(node)}>
      <span className="node-dot" style={{ width: size, height: size }} />
      <span className="node-name">{node.name}</span>
      <span className="node-meta">
        {node.rank ? `${node.rank} · ` : ""}
        {node.aphia_id ? `AphiaID ${node.aphia_id} · ` : ""}
        {(node.entry_count ?? 1).toLocaleString()} placements · {node.image_count.toLocaleString()} images
      </span>
      {(node.datasets ?? []).map((dataset) => <DatasetBadge key={dataset} id={dataset} />)}
      {(node.lineage_notes ?? []).map((note) => <NoteBadge key={note} note={note} />)}
      {(node.risk_flags ?? []).map((risk) => <RiskBadge key={risk} risk={risk} />)}
    </div>
  );

  if (isLeaf) {
    return (
      <button className="terminal-chip standalone" onClick={() => onSelect(node)}>
        <span>{node.dataset_label ?? node.dataset_id}</span>
        <strong>{node.name}</strong>
        <em>{node.image_count.toLocaleString()} images</em>
      </button>
    );
  }

  if (children.length === 0) {
    return <div className="tree-leaf">{content}</div>;
  }

  return (
    <details className="tree-branch" open={shouldDefaultOpen(node)}>
      <summary>
        <ChevronRight className="chevron" size={16} />
        {content}
      </summary>
      {terminalPlacements.length > 0 && (
        <div className="terminal-strip">
          <span className="terminal-label">
            Terminal here{hasFinerDescendants ? " · finer descendants below" : ""}
          </span>
          <div className="terminal-list">
            {terminalPlacements.map((placement) => (
              <button
                className="terminal-chip"
                key={placement.placement_id ?? placement.entry_id}
                onClick={() => onSelect(placement)}
              >
                <span>{placement.dataset_label ?? placement.dataset_id}</span>
                <strong>{placement.name}</strong>
                <em>{placement.image_count.toLocaleString()} images</em>
                {(placement.risk_flags ?? []).map((risk) => <RiskBadge key={risk} risk={risk} />)}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="tree-children">
        {taxonChildren.map((child) => (
          <TaxonomyTree
            key={child.placement_id ?? child.entry_id ?? `${child.rank}-${child.aphia_id}-${child.name}`}
            node={child}
            onSelect={onSelect}
          />
        ))}
      </div>
    </details>
  );
}
