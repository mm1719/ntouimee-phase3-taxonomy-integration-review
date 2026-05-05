export type DatasetId =
  | "life_watch"
  | "flowcam_net"
  | "tara_pacific_deck"
  | "tara_pacific_bongo"
  | "ifremer_srn";

export type TreeNode = {
  type: "root" | "taxon" | "dataset_class";
  name: string;
  rank?: string;
  aphia_id?: string;
  entry_id?: string;
  placement_id?: string;
  dataset_id?: DatasetId;
  dataset_label?: string;
  selected_aphia_id?: string;
  selected_aphia_source?: string;
  image_count: number;
  entry_count: number;
  datasets?: DatasetId[];
  lineage_notes?: string[];
  risk_flags?: string[];
  children?: TreeNode[];
  dataset_colors?: Record<DatasetId, string>;
  dataset_labels?: Record<DatasetId, string>;
  dataset_class_entry_count?: number;
  unique_candidate_image_count?: number;
  placement_weighted_image_count?: number;
};

export type Candidate = {
  entry_id: string;
  dataset_id: DatasetId;
  label: string;
  image_count: string;
  selected_aphia_ids: string;
  selected_aphia_source: string;
  terminal_worms_names: string;
  terminal_ranks: string;
  lineage_notes: string;
  risk_flags: string;
  validation_statuses: string;
  invalid_statuses: string;
  worms_aphia_ids: string;
  dwca_aphia_ids: string;
  worms_record_urls: string;
  source_example: string;
};

export type ImageSample = {
  dataset_id: DatasetId;
  label: string;
  image_id: string;
  thumbnail_url: string;
  source_ref: string;
  width: string;
  height: string;
};

export type SampleMap = Record<string, ImageSample[]>;
