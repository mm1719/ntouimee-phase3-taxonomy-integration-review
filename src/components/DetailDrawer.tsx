import { X, Images } from "lucide-react";
import { DatasetBadge, NoteBadge, RiskBadge, SpecialTagBadge } from "./Badges";
import type { Candidate, ImageSample, InvalidLabelGroup, SampleMap, TreeNode } from "../types";
import { splitCell } from "../utils/csv";

type Props = {
  node: TreeNode | null;
  candidate?: Candidate;
  samples: ImageSample[];
  sampleMap: SampleMap;
  invalidSampleMap: SampleMap;
  invalidGroups: InvalidLabelGroup[];
  onClose: () => void;
  onOpenSamples: (entryId: string) => void;
  onOpenInvalidSamples: (sampleKey: string) => void;
};

type StatusEvidence = {
  source?: string;
  aphia_id?: string;
  name?: string;
  rank?: string;
  status?: string;
  valid_aphia_id?: string;
  valid_name?: string;
  record_url?: string;
};

function parseStatusEvidence(value = ""): StatusEvidence[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function DetailDrawer({
  node,
  candidate,
  samples,
  sampleMap,
  invalidSampleMap,
  invalidGroups,
  onClose,
  onOpenSamples,
  onOpenInvalidSamples
}: Props) {
  if (!node) return null;
  const selectedIds = candidate ? splitCell(candidate.selected_aphia_ids) : [];
  const selectedCounts = candidate ? splitCell(candidate.selected_aphia_image_counts) : [];
  const statusEvidence = parseStatusEvidence(candidate?.status_review_evidence_json);
  const statusFlags = candidate ? splitCell(candidate.status_review_flag) : [];
  const isCorrected = statusFlags.includes("corrected");
  const displayedStatusEvidence = isCorrected
    ? statusEvidence.filter((record) => record.source === "original" || record.source === "valid_target")
    : statusEvidence;
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
          {[...new Set([
            ...(node.special_tags ?? []),
            ...(candidate ? splitCell(candidate.special_tags) : [])
          ])].map((tag) => <SpecialTagBadge key={tag} tag={tag} />)}
        </div>
      </div>

      <dl className="kv">
        <div><dt>Rank</dt><dd>{node.rank || "Dataset class"}</dd></div>
        <div><dt>AphiaID</dt><dd>{node.selected_aphia_id || node.aphia_id || "n/a"}</dd></div>
        <div><dt>Image count</dt><dd>{node.image_count.toLocaleString()}</dd></div>
        {node.candidate_image_count && node.candidate_image_count !== node.image_count && (
          <div><dt>Class images</dt><dd>{node.candidate_image_count.toLocaleString()}</dd></div>
        )}
        <div><dt>Placements</dt><dd>{node.entry_count.toLocaleString()}</dd></div>
        {candidate && <div><dt>Source priority</dt><dd>{candidate.selected_aphia_source}</dd></div>}
        {candidate && <div><dt>Terminal rank</dt><dd>{candidate.terminal_ranks.split("|").join(", ")}</dd></div>}
        {candidate?.original_label && candidate.original_label !== candidate.label && (
          <div><dt>Original label</dt><dd>{candidate.original_label}</dd></div>
        )}
      </dl>

      {candidate?.synonym_note && !candidate?.status_review_flag && (
        <div className="drawer-section">
          <h3>Synonym correction</h3>
          <dl className="kv compact-kv">
            <div><dt>Accepted name</dt><dd>{candidate.accepted_name || "n/a"}</dd></div>
            <div><dt>Accepted AphiaID</dt><dd>{candidate.accepted_aphia_id || "n/a"}</dd></div>
          </dl>
          <p className="muted">{candidate.synonym_note}</p>
        </div>
      )}

      {candidate?.status_review_flag && (
        <div className="drawer-section">
          <h3>{isCorrected ? "WoRMS correction review" : "WoRMS status review"}</h3>
          <dl className="kv compact-kv">
            <div><dt>Review flag</dt><dd>{candidate.status_review_flag.split("|").join(", ")}</dd></div>
            {isCorrected ? (
              <>
                <div><dt>Corrected AphiaID</dt><dd>{candidate.selected_aphia_ids || "n/a"}</dd></div>
                <div><dt>Accepted target</dt><dd>{candidate.accepted_name || "n/a"}</dd></div>
                <div><dt>Accepted AphiaID</dt><dd>{candidate.accepted_aphia_id || "n/a"}</dd></div>
              </>
            ) : (
              <>
                <div><dt>Rollup AphiaID</dt><dd>{candidate.status_review_rollup_aphia_id || "n/a"}</dd></div>
                <div><dt>Rollup taxon</dt><dd>{candidate.status_review_rollup_name || "n/a"}</dd></div>
                <div><dt>Rollup rank</dt><dd>{candidate.status_review_rollup_rank || "n/a"}</dd></div>
              </>
            )}
          </dl>
          {candidate.synonym_note && <p className="muted">{candidate.synonym_note}</p>}
          {displayedStatusEvidence.length > 0 && (
            <div className="evidence-list">
              {displayedStatusEvidence.map((record, index) => (
                <div className="evidence-item" key={`${record.source}-${record.aphia_id}-${index}`}>
                  <dl className="kv compact-kv">
                    <div><dt>Source</dt><dd>{record.source || "n/a"}</dd></div>
                    <div><dt>AphiaID</dt><dd><code>{record.aphia_id || "n/a"}</code></dd></div>
                    <div><dt>Name</dt><dd>{record.name || "n/a"}</dd></div>
                    <div><dt>Rank / status</dt><dd>{[record.rank, record.status].filter(Boolean).join(" / ") || "n/a"}</dd></div>
                    <div><dt>Valid target</dt><dd>{[record.valid_aphia_id, record.valid_name].filter(Boolean).join(" ") || "n/a"}</dd></div>
                  </dl>
                  {record.record_url && (
                    <a href={record.record_url} target="_blank" rel="noreferrer" className="link">
                      {record.record_url}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {candidate?.broad_class && (
        <div className="drawer-section">
          <h3>Broad class mapping</h3>
          <dl className="kv compact-kv">
            <div><dt>Broad class</dt><dd>{candidate.broad_class}</dd></div>
            <div><dt>Original label</dt><dd>{candidate.broad_class_original_label || candidate.original_label}</dd></div>
            <div><dt>Broad AphiaID</dt><dd>{candidate.broad_class_aphia_id || "n/a"}</dd></div>
          </dl>
          <p className="path-text">{candidate.broad_class_source_file}</p>
        </div>
      )}

      {candidate?.contaminated_sources && (
        <div className="drawer-section">
          <h3>Baseline invalid validation</h3>
          <dl className="kv compact-kv">
            <div><dt>Valid images</dt><dd>{Number(candidate.valid_image_count || candidate.image_count).toLocaleString()}</dd></div>
            <div><dt>Invalid images</dt><dd>{Number(candidate.invalid_image_count || candidate.image_count).toLocaleString()}</dd></div>
          </dl>
          <p className="path-text">{candidate.contaminated_sources}</p>
          <div className="evidence-actions">
            <button className="ghost-button" onClick={() => onOpenSamples(candidate.entry_id)}>
              <Images size={16} />
              Valid evidence thumbnails ({samples.length})
            </button>
            {invalidGroups.map((group) => (
              <button
                className="ghost-button"
                key={group.sample_key}
                onClick={() => onOpenInvalidSamples(group.sample_key)}
              >
                <Images size={16} />
                Invalid evidence thumbnails: {group.status} ({invalidSampleMap[group.sample_key]?.length ?? 0})
              </button>
            ))}
          </div>
        </div>
      )}

      {candidate && selectedIds.length > 1 && (
        <div className="drawer-section">
          <h3>Selected AphiaID evidence</h3>
          <div className="evidence-list">
            {selectedIds.map((id, index) => {
              const key = `${candidate.entry_id}::aphia::${id}`;
              const aphiaSamples = sampleMap[key] ?? [];
              return (
                <div className="evidence-item" key={id}>
                  <dl className="kv compact-kv">
                    <div><dt>AphiaID</dt><dd><code>{id}</code></dd></div>
                    <div><dt>Images</dt><dd>{Number(selectedCounts[index] || 0).toLocaleString()}</dd></div>
                  </dl>
                  <button
                    className="ghost-button"
                    disabled={aphiaSamples.length === 0}
                    onClick={() => onOpenSamples(key)}
                  >
                    <Images size={16} />
                    Open {aphiaSamples.length} AphiaID thumbnails
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {candidate && selectedIds.length <= 1 && (
        <div className="drawer-section">
          <h3>Selected AphiaID</h3>
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
