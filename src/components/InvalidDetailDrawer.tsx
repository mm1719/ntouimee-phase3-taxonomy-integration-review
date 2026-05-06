import { Images, X } from "lucide-react";
import { DatasetBadge } from "./Badges";
import type { InvalidLabelGroup, ImageSample } from "../types";

type Props = {
  group: InvalidLabelGroup | null;
  samples: ImageSample[];
  onClose: () => void;
  onOpenSamples: (sampleKey: string) => void;
};

export function InvalidDetailDrawer({ group, samples, onClose, onOpenSamples }: Props) {
  if (!group) return null;
  const sourceLimit = 5;

  return (
    <aside className="drawer">
      <div className="drawer-header">
        <div>
          <p className="eyebrow">Invalid label group</p>
          <h2>{group.aliases.join(" / ")}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close detail drawer">
          <X size={18} />
        </button>
      </div>

      <div className="drawer-section">
        <div className="stack">
          {group.dataset_ids.map((dataset) => <DatasetBadge key={dataset} id={dataset} />)}
          <span className="risk-badge">{group.status}</span>
          {group.include_valid_tree_overlap && <span className="note-badge">Valid-tree overlap</span>}
        </div>
      </div>

      <dl className="kv">
        <div><dt>Status</dt><dd>{group.status}</dd></div>
        <div><dt>Total images</dt><dd>{group.total_image_count.toLocaleString()}</dd></div>
        <div><dt>Aliases</dt><dd>{group.aliases.join(", ")}</dd></div>
      </dl>

      {group.datasets.map((dataset) => (
        <div className="drawer-section" key={dataset.dataset_id}>
          <h3>{dataset.dataset_id}</h3>
          <dl className="kv compact-kv">
            <div><dt>Images</dt><dd>{dataset.image_count.toLocaleString()}</dd></div>
            <div><dt>Aliases</dt><dd>{dataset.aliases.join(", ")}</dd></div>
            <div><dt>Valid tree</dt><dd>{dataset.valid_tree_entry}</dd></div>
          </dl>

          <h3>Reasons</h3>
          <ul className="detail-list">
            {dataset.reasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>

          <h3>Local sources</h3>
          <ul className="detail-list">
            {dataset.source_examples.slice(0, sourceLimit).map((source) => (
              <li className="path-text" key={source}>{source}</li>
            ))}
            {dataset.source_examples.length > sourceLimit && (
              <li className="muted">
                {dataset.source_examples.length - sourceLimit} more sources recorded in the JSON data.
              </li>
            )}
          </ul>
        </div>
      ))}

      <div className="drawer-section">
        <button className="primary-button" onClick={() => onOpenSamples(group.sample_key)}>
          <Images size={16} />
          Open {samples.length || 5} sample thumbnails
        </button>
        <p className="muted">
          Samples are drawn from analysis-ready manifests and keep relative source references.
        </p>
      </div>
    </aside>
  );
}
