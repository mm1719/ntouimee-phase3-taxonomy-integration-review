import { datasetColor, datasetLabel, NOTE_LABELS, RISK_LABELS, SPECIAL_TAG_LABELS } from "../data/constants";
import type { DatasetId } from "../types";

export function DatasetBadge({ id }: { id: DatasetId }) {
  return (
    <span className="badge" style={{ borderColor: datasetColor(id) }}>
      {datasetLabel(id)}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: string }) {
  return <span className={`risk-badge risk-${risk}`}>{RISK_LABELS[risk] ?? risk}</span>;
}

export function SpecialTagBadge({ tag }: { tag: string }) {
  return <span className={`special-tag tag-${tag}`}>{SPECIAL_TAG_LABELS[tag] ?? tag}</span>;
}

export function NoteBadge({ note }: { note: string }) {
  return <span className="note-badge" title="Structural taxonomy note, not a risk">{NOTE_LABELS[note] ?? note}</span>;
}
