import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { DatasetBadge, NoteBadge, RiskBadge } from "./Badges";
import { shouldDefaultOpen } from "../utils/tree";
import type { TreeNode } from "../types";

type Props = {
  node: TreeNode;
  onSelect: (node: TreeNode) => void;
  depth?: number;
  autoOpenForTerminal?: boolean;
};

export function TaxonomyTree({ node, onSelect, depth = 0, autoOpenForTerminal = false }: Props) {
  const children = node.children ?? [];
  const isLeaf = node.type === "dataset_class";
  const terminalPlacements = children.filter((child) => child.type === "dataset_class");
  const taxonChildren = children.filter((child) => child.type !== "dataset_class");
  const hasFinerDescendants = taxonChildren.length > 0;
  const hasDirectTerminal = terminalPlacements.length > 0;
  const defaultOpen = shouldDefaultOpen(node, depth);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [openedByUser, setOpenedByUser] = useState(false);
  const [autoOpenedForTerminal, setAutoOpenedForTerminal] = useState(false);
  const [userClosedAutoOpen, setUserClosedAutoOpen] = useState(false);
  const suppressNextToggle = useRef(false);
  const showTerminalPlacements = terminalPlacements.length > 0 && (openedByUser || autoOpenedForTerminal);
  const size = Math.max(8, Math.min(26, 8 + Math.sqrt(Math.max(0, node.image_count)) / 45));

  useEffect(() => {
    if (!autoOpenForTerminal) {
      setUserClosedAutoOpen(false);
      return;
    }
    if (hasDirectTerminal && !isOpen && !userClosedAutoOpen) {
      suppressNextToggle.current = true;
      setIsOpen(true);
      setAutoOpenedForTerminal(true);
      setOpenedByUser(false);
    }
  }, [autoOpenForTerminal, hasDirectTerminal, isOpen, userClosedAutoOpen]);

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
    <details
      className="tree-branch"
      open={isOpen}
      onToggle={(event) => {
        const nextOpen = event.currentTarget.open;
        if (suppressNextToggle.current) {
          suppressNextToggle.current = false;
          return;
        }
        setIsOpen(nextOpen);
        if (nextOpen) {
          setOpenedByUser(true);
          setAutoOpenedForTerminal(false);
          setUserClosedAutoOpen(false);
        } else {
          setOpenedByUser(false);
          setAutoOpenedForTerminal(false);
          setUserClosedAutoOpen(true);
        }
      }}
    >
      <summary>
        <ChevronRight className="chevron" size={16} />
        {content}
      </summary>
      {showTerminalPlacements && (
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
            depth={depth + 1}
            autoOpenForTerminal={isOpen && openedByUser}
          />
        ))}
      </div>
    </details>
  );
}
