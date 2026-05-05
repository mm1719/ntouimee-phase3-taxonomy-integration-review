import { X, Images } from "lucide-react";
import { DatasetBadge, NoteBadge, RiskBadge } from "./Badges";
import type { Candidate, ImageSample, TreeNode } from "../types";
import { splitCell } from "../utils/csv";

type Props = {
  node: TreeNode | null;
  candidate?: Candidate;
  samples: ImageSample[];
  onClose: () => void;
  onOpenSamples: (entryId: string) => void;
};

export function DetailDrawer({ node, candidate, samples, onClose, onOpenSamples }: Props) {
  if (!node) return null;
  const selectedIds = candidate ? splitCell(candidate.selected_aphia_ids) : [];
  const datasetBadges = [...new Set([
    ...(node.dataset_id ? [node.dataset_id] : []),
    ...(node.datasets ?? [])
  ])];

  return (
    <aside className="drawer">
      <div className="drawer-header">
        <div>
          <p className="eyebrow">{node.type === "dataset_class" ? "Dataset-class entry" : "Taxon node"}</p>
          <h2>{node.name}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close detail drawer">
          <X size={18} />
        </button>
      </div>

      <div className="drawer-section">
        <div className="stack">
          {datasetBadges.map((dataset) => <DatasetBadge key={dataset} id={dataset} />)}
          {(node.lineage_notes ?? []).map((note) => <NoteBadge key={note} note={note} />)}
          {(node.risk_flags ?? []).map((risk) => <RiskBadge key={risk} risk={risk} />)}
        </div>
      </div>

      <dl className="kv">
        <div><dt>Rank</dt><dd>{node.rank || "Dataset class"}</dd></div>
        <div><dt>AphiaID</dt><dd>{node.selected_aphia_id || node.aphia_id || "n/a"}</dd></div>
        <div><dt>Image count</dt><dd>{node.image_count.toLocaleString()}</dd></div>
        <div><dt>Placements</dt><dd>{node.entry_count.toLocaleString()}</dd></div>
        {candidate && <div><dt>Source priority</dt><dd>{candidate.selected_aphia_source}</dd></div>}
        {candidate && <div><dt>Terminal rank</dt><dd>{candidate.terminal_ranks.split("|").join(", ")}</dd></div>}
      </dl>

      {candidate && (
        <div className="drawer-section">
          <h3>Selected AphiaIDs</h3>
          <div className="pill-row">
            {selectedIds.map((id) => (
              <span className="pill" key={id}>{id}</span>
            ))}
          </div>
        </div>
      )}

      {candidate && (
        <div className="drawer-section">
          <h3>Source references</h3>
          <p className="path-text">{candidate.source_example || "No local source example recorded."}</p>
          {splitCell(candidate.worms_record_urls).map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="link">
              {url}
            </a>
          ))}
        </div>
      )}

      {candidate && (
        <div className="drawer-section">
          <button className="primary-button" onClick={() => onOpenSamples(candidate.entry_id)}>
            <Images size={16} />
            Open {samples.length || 10} sample thumbnails
          </button>
          <p className="muted">
            Public mode serves resized thumbnails and keeps the original source as a relative reference.
          </p>
        </div>
      )}
    </aside>
  );
}
