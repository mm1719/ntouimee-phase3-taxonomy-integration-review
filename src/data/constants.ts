import type { DatasetId } from "../types";

export const DATASET_LABELS: Record<DatasetId, string> = {
  life_watch: "LifeWatch",
  life_watch_2026_image_library: "LifeWatch 2026",
  flowcam_net: "FlowCAMNet",
  tara_pacific_deck: "Tara Pacific Deck",
  tara_pacific_bongo: "Tara Pacific Bongo",
  ifremer_srn: "Ifremer SRN"
};

export const DATASET_COLORS: Record<DatasetId, string> = {
  life_watch: "#2563eb",
  life_watch_2026_image_library: "#7c3aed",
  flowcam_net: "#16a34a",
  tara_pacific_deck: "#f97316",
  tara_pacific_bongo: "#dc2626",
  ifremer_srn: "#0891b2"
};

export const DATASETS = Object.keys(DATASET_LABELS) as DatasetId[];

export const CORE_RANKS = new Set([
  "Root",
  "Superdomain",
  "Kingdom",
  "Phylum",
  "Class",
  "Order",
  "Family",
  "Genus",
  "Species"
]);

export const RISK_LABELS: Record<string, string> = {
  dwca_aphia_mismatch: "DwC/Aphia mismatch",
  contaminated: "Contaminated",
  multiple_valid_aphia_ids: "Multiple AphiaID"
};

export const NOTE_LABELS: Record<string, string> = {
  intermediate_rank: "Intermediate rank"
};
