import type { DatasetId } from "../types";

export const DATASET_LABELS: Record<string, string> = {
  life_watch: "LifeWatch",
  life_watch_2026_image_library: "LifeWatch 2026",
  flowcam_net: "FlowCAMNet",
  tara_pacific_deck: "Tara Pacific Deck",
  tara_pacific_bongo: "Tara Pacific Bongo",
  ifremer_srn: "Ifremer SRN",
  whoi_plankton: "WHOI Plankton",
  syke_ifcb: "SYKE IFCB",
  medplanktonset: "MedPlanktonSet",
  planktoscope: "PlanktoScope"
};

export const DATASET_COLORS: Record<string, string> = {
  life_watch: "#2563eb",
  life_watch_2026_image_library: "#7c3aed",
  flowcam_net: "#16a34a",
  tara_pacific_deck: "#f97316",
  tara_pacific_bongo: "#dc2626",
  ifremer_srn: "#0891b2",
  whoi_plankton: "#8b5cf6",
  syke_ifcb: "#a855f7",
  medplanktonset: "#c026d3",
  planktoscope: "#db2777"
};

export const DATASETS = Object.keys(DATASET_LABELS) as DatasetId[];
export const ECOTAXA_DATASET_COLOR = "#0f766e";

export function datasetLabel(
  dataset: DatasetId,
  labels: Record<string, string> = {}
) {
  if (labels[dataset]) return labels[dataset];
  if (DATASET_LABELS[dataset]) return DATASET_LABELS[dataset];
  if (dataset.startsWith("ecotaxa_")) return `EcoTaxa ${dataset.replace("ecotaxa_", "")}`;
  return dataset;
}

export function datasetColor(dataset: DatasetId) {
  if (DATASET_COLORS[dataset]) return DATASET_COLORS[dataset];
  if (dataset.startsWith("ecotaxa_")) return ECOTAXA_DATASET_COLOR;
  return "#6b7280";
}

export function datasetSort(a: DatasetId, b: DatasetId) {
  const aKnown = DATASETS.indexOf(a);
  const bKnown = DATASETS.indexOf(b);
  if (aKnown !== -1 || bKnown !== -1) {
    if (aKnown === -1) return 1;
    if (bKnown === -1) return -1;
    return aKnown - bKnown;
  }
  const aProject = a.startsWith("ecotaxa_") ? Number(a.replace("ecotaxa_", "")) : NaN;
  const bProject = b.startsWith("ecotaxa_") ? Number(b.replace("ecotaxa_", "")) : NaN;
  if (!Number.isNaN(aProject) || !Number.isNaN(bProject)) {
    if (Number.isNaN(aProject)) return 1;
    if (Number.isNaN(bProject)) return -1;
    return aProject - bProject;
  }
  return a.localeCompare(b);
}

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
  contaminated: "Contaminated",
  subordinate_aphia_id: "Subordinate AphiaID",
  broad_class: "Broad class",
  corrected: "Corrected",
  challenged: "Challenged"
};

export const SPECIAL_TAG_LABELS: Record<string, string> = {
  dwc_record_review: "DwC Record",
  multiple: "Multiple",
  juvenile: "Juvenile"
};

export const NOTE_LABELS: Record<string, string> = {};
