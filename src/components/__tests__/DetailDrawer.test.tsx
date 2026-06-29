import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DetailDrawer } from "../DetailDrawer";
import type { Candidate, TreeNode } from "../../types";

const candidate: Candidate = {
  entry_id: "life_watch_2026_image_library::Dissodinium pseudolunula",
  dataset_id: "life_watch_2026_image_library",
  label: "Dissodinium pseudolunula",
  original_label: "Dissodinium pseudolunula",
  image_count: "4",
  selected_aphia_ids: "109444",
  selected_aphia_image_counts: "4",
  selected_aphia_source: "worms_status_challenged_rollup",
  valid_image_count: "4",
  invalid_image_count: "0",
  terminal_worms_names: "Pyrocystaceae",
  terminal_ranks: "Family",
  lineage_notes: "",
  risk_flags: "challenged",
  special_tags: "",
  contaminated_sources: "",
  validation_statuses: "Valid AphiaID Match",
  invalid_statuses: "",
  worms_aphia_ids: "110325",
  dwca_aphia_ids: "",
  dwca_usable_aphia_ids: "",
  dwca_review_aphia_ids: "",
  dwca_review_reasons: "",
  worms_record_urls: "https://www.marinespecies.org/aphia.php?p=taxdetails&id=109444",
  synonym_note: "WoRMS status review: 110325:Dissodinium pseudolunula -> 109444:Pyrocystaceae",
  accepted_name: "",
  accepted_aphia_id: "",
  status_review_flag: "challenged",
  status_review_rollup_aphia_id: "109444",
  status_review_rollup_name: "Pyrocystaceae",
  status_review_rollup_rank: "Family",
  status_review_evidence_json: JSON.stringify([
    {
      source: "original",
      aphia_id: "110325",
      name: "Dissodinium pseudolunula",
      rank: "Species",
      status: "accepted",
      valid_aphia_id: "110325",
      valid_name: "Dissodinium pseudolunula",
      record_url: "https://www.marinespecies.org/aphia.php?p=taxdetails&id=110325"
    }
  ]),
  broad_class: "",
  broad_class_original_label: "",
  broad_class_aphia_id: "",
  broad_class_source_file: "",
  source_example: "metadata.csv"
};

const node: TreeNode = {
  type: "dataset_class",
  name: candidate.label,
  entry_id: candidate.entry_id,
  dataset_id: candidate.dataset_id,
  original_label: candidate.original_label,
  selected_aphia_id: "109444",
  selected_aphia_source: candidate.selected_aphia_source,
  image_count: 4,
  entry_count: 1,
  risk_flags: ["challenged"],
  children: []
};

describe("DetailDrawer", () => {
  it("shows status review evidence with title-case risk labels", () => {
    render(
      <DetailDrawer
        node={node}
        candidate={candidate}
        samples={[]}
        sampleMap={{}}
        invalidSampleMap={{}}
        invalidGroups={[]}
        onClose={vi.fn()}
        onOpenSamples={vi.fn()}
        onOpenInvalidSamples={vi.fn()}
      />
    );

    expect(screen.getByText("Challenged")).toBeInTheDocument();
    expect(screen.queryByText("CHALLENGED")).not.toBeInTheDocument();
    expect(screen.getByText("WoRMS status review")).toBeInTheDocument();
    expect(screen.getByText("Pyrocystaceae")).toBeInTheDocument();
    expect(screen.getAllByText("Dissodinium pseudolunula").length).toBeGreaterThan(0);
  });
});
