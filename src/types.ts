export type DatasetId =
  | "life_watch"
  | "life_watch_2026_image_library"
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
  original_label?: string;
  selected_aphia_id?: string;
  selected_aphia_source?: string;
  synonym_note?: string;
  broad_class?: string;
  broad_class_original_label?: string;
  broad_class_aphia_id?: string;
  broad_class_source_file?: string;
  contaminated_sources?: string;
  image_count: number;
  entry_count: number;
  datasets?: DatasetId[];
  lineage_notes?: string[];
  risk_flags?: string[];
  children?: TreeNode[];
  dataset_colors?: Record<DatasetId, string>;
  dataset_labels?: Record<DatasetId, string>;
  dataset_class_entry_count?: number;
  unique_selected_aphia_id_count?: number;
  unique_candidate_image_count?: number;
  placement_weighted_image_count?: number;
  candidate_image_count?: number;
  selected_aphia_image_count?: number;
  valid_image_count?: number;
  invalid_image_count?: number;
};

export type Candidate = {
  entry_id: string;
  dataset_id: DatasetId;
  label: string;
  original_label: string;
  image_count: string;
  selected_aphia_ids: string;
  selected_aphia_image_counts: string;
  selected_aphia_source: string;
  valid_image_count: string;
  invalid_image_count: string;
  terminal_worms_names: string;
  terminal_ranks: string;
  lineage_notes: string;
  risk_flags: string;
  contaminated_sources: string;
  validation_statuses: string;
  invalid_statuses: string;
  worms_aphia_ids: string;
  dwca_aphia_ids: string;
  worms_record_urls: string;
  synonym_note: string;
  accepted_name: string;
  accepted_aphia_id: string;
  broad_class: string;
  broad_class_original_label: string;
  broad_class_aphia_id: string;
  broad_class_source_file: string;
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

export type InvalidDatasetEvidence = {
  dataset_id: DatasetId;
  aliases: string[];
  image_count: number;
  reasons: string[];
  source_examples: string[];
  worms_sources: string[];
  valid_tree_entry: "yes" | "no";
  invalid_reason_count?: number;
  valid_image_count?: number;
  invalid_image_count?: number;
};

export type InvalidLabelGroup = {
  group_key: string;
  pseudo_aphia_id: string;
  sample_key: string;
  aliases: string[];
  status: "Non-Taxonomic Category" | "Taxonomic Mismatch";
  dataset_ids: DatasetId[];
  total_image_count: number;
  include_valid_tree_overlap: boolean;
  invalid_reason_count?: number;
  valid_image_count?: number;
  invalid_image_count?: number;
  datasets: InvalidDatasetEvidence[];
};

export type InvalidLabelData = {
  tables: {
    non_taxonomic_category: InvalidLabelGroup[];
    taxonomic_mismatch: InvalidLabelGroup[];
  };
  samples: SampleMap;
  summary: {
    source: string;
    sample_limit_per_dataset: number;
    excluded_valid_tree_overlap_default: boolean;
    table_counts: Record<string, number>;
    table_image_counts: Record<string, number>;
    evidence_table_total_group_count: number;
    evidence_table_total_image_count: number;
    unique_group_count: number;
    total_image_count: number;
    total_image_count_semantics: string;
  };
};

export type MappingTarget = {
  source_id: string;
  source_alias: string;
  image_count: number;
  valid_statuses: string;
  invalid_reasons: string;
  risk_flags: string;
  dataset_ids: string;
  source_labels: string;
};

export type MappingRuleRow = {
  action: "keep" | "merge" | "drop";
  source_id: string;
  target_id: string;
  source_alias: string;
  target_alias: string;
  notes: string;
  validation_status: "ok" | "invalid_source_id" | "invalid_target_id";
  validation_message: string;
};

export type MappingHistory = {
  history_id: string;
  file_name: string;
  path: string;
  row_count: number;
  explicit_row_count: number;
  merge_count: number;
  drop_count: number;
  warning_count: number;
  warnings: Array<{ source_id: string; message: string }>;
  rows: MappingRuleRow[];
};

export type MappingStatusData = {
  generated_at_utc: string;
  source_targets: string;
  history_dir: string;
  export_fields: string[];
  target_count: number;
  targets: MappingTarget[];
  latest_history_id: string;
  histories: MappingHistory[];
};
