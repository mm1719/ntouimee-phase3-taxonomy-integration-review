import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RiskPanels } from "../RiskPanels";
import type { Candidate } from "../../types";

const baseCandidate: Candidate = {
  entry_id: "base::entry",
  dataset_id: "flowcam_net",
  label: "Base",
  original_label: "Base",
  image_count: "0",
  selected_aphia_ids: "",
  selected_aphia_source: "",
  terminal_worms_names: "",
  terminal_ranks: "",
  lineage_notes: "",
  risk_flags: "",
  contaminated_sources: "",
  validation_statuses: "",
  invalid_statuses: "",
  worms_aphia_ids: "",
  dwca_aphia_ids: "",
  dwca_usable_aphia_ids: "",
  dwca_review_aphia_ids: "",
  dwca_review_reasons: "",
  worms_record_urls: "",
  special_tags: "",
  synonym_note: "",
  accepted_name: "",
  accepted_aphia_id: "",
  status_review_flag: "",
  status_review_rollup_aphia_id: "",
  status_review_rollup_name: "",
  status_review_rollup_rank: "",
  status_review_evidence_json: "",
  broad_class: "",
  broad_class_original_label: "",
  broad_class_aphia_id: "",
  broad_class_source_file: "",
  source_example: ""
};

const candidates: Candidate[] = [
  {
    ...baseCandidate,
    entry_id: "deck::dwc",
    dataset_id: "tara_pacific_deck",
    label: "DwC conflict",
    image_count: "11",
    selected_aphia_ids: "1066",
    selected_aphia_source: "worms_name_assignment",
    terminal_ranks: "Subphylum",
    special_tags: "dwc_record_review",
    dwca_aphia_ids: "999999",
    dwca_review_aphia_ids: "999999",
    dwca_review_reasons: "999999: isExtinct=1"
  },
  {
    ...baseCandidate,
    entry_id: "life::contaminated",
    dataset_id: "life_watch",
    label: "Tripos",
    image_count: "600",
    selected_aphia_ids: "109485",
    risk_flags: "contaminated",
    invalid_statuses: "Taxonomic Mismatch | Non-Taxonomic Category",
    contaminated_sources: "Taxonomic Mismatch: AphiaID resolves to another taxon | Non-Taxonomic Category: invalid evidence row"
  },
  {
    ...baseCandidate,
    entry_id: "bongo::multiple",
    dataset_id: "tara_pacific_bongo",
    label: "Multiple valid",
    image_count: "3",
    selected_aphia_ids: "1 | 2",
    terminal_worms_names: "Taxon one | Taxon two",
    terminal_ranks: "Genus | Species",
    risk_flags: "subordinate_aphia_id"
  },
  {
    ...baseCandidate,
    entry_id: "life::subordinate",
    dataset_id: "life_watch",
    label: "Bellerochea",
    image_count: "8795",
    selected_aphia_ids: "447730",
    terminal_worms_names: "Bellerochea horologicalis",
    terminal_ranks: "Species",
    risk_flags: "subordinate_aphia_id"
  },
  {
    ...baseCandidate,
    entry_id: "life::colony",
    dataset_id: "life_watch",
    label: "Pennate Diatom colony",
    original_label: "Pennate Diatom colony",
    image_count: "200",
    selected_aphia_ids: "148899",
    terminal_worms_names: "Bacillariophyceae",
    terminal_ranks: "Class",
    special_tags: "multiple"
  },
  {
    ...baseCandidate,
    entry_id: "deck::larvae",
    dataset_id: "tara_pacific_deck",
    label: "Crustacea larvae",
    original_label: "Crustacea larvae",
    image_count: "17",
    selected_aphia_ids: "1066",
    terminal_worms_names: "Crustacea",
    terminal_ranks: "Subphylum",
    special_tags: "juvenile"
  },
  {
    ...baseCandidate,
    entry_id: "flow::broad",
    dataset_id: "flowcam_net",
    label: "Crustacea broad",
    image_count: "8",
    selected_aphia_ids: "1066",
    risk_flags: "broad_class",
    broad_class: "Crustacea",
    broad_class_original_label: "Crustacea broad",
    broad_class_aphia_id: "1066",
    broad_class_source_file: "studies/label_aphia_inventory/round3_invalid_label_cleanup.csv"
  },
  {
    ...baseCandidate,
    entry_id: "deck::corrected",
    dataset_id: "tara_pacific_deck",
    label: "Neoceratium furca",
    image_count: "387",
    selected_aphia_ids: "840627",
    risk_flags: "corrected",
    worms_aphia_ids: "495659",
    accepted_name: "Tripos furca",
    accepted_aphia_id: "840627",
    synonym_note: "WoRMS status review: 495659:Neoceratium furca -> 840627:Tripos furca"
  },
  {
    ...baseCandidate,
    entry_id: "life::challenged",
    dataset_id: "life_watch_2026_image_library",
    label: "Dissodinium pseudolunula",
    image_count: "4",
    selected_aphia_ids: "109444",
    risk_flags: "challenged",
    worms_aphia_ids: "110325",
    status_review_rollup_aphia_id: "109444",
    status_review_rollup_name: "Pyrocystaceae",
    status_review_rollup_rank: "Family",
    synonym_note: "WoRMS status review: 110325:Dissodinium pseudolunula -> 109444:Pyrocystaceae"
  }
];

function tableHeaders() {
  return screen.getAllByRole("columnheader").map((header) => header.textContent);
}

describe("RiskPanels", () => {
  it("shows DwC record review specific columns by default", () => {
    render(<RiskPanels candidates={candidates} onSelect={vi.fn()} />);

    expect(tableHeaders()).toEqual([
      "ID",
      "Dataset",
      "Label",
      "Images",
      "Selected AphiaID",
      "Review DwC ID",
      "All DwC IDs",
      "Review reason"
    ]);
    expect(screen.getByText("DwC conflict")).toBeInTheDocument();
    expect(screen.getAllByText("999999")).toHaveLength(2);
    expect(screen.getByText("999999: isExtinct=1")).toBeInTheDocument();
  });

  it("switches to contaminated evidence columns and keeps baseline invalid validation visible", async () => {
    const user = userEvent.setup();
    render(<RiskPanels candidates={candidates} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Contaminated/ }));

    expect(tableHeaders()).toEqual([
      "ID",
      "Dataset",
      "Label",
      "Images",
      "Selected AphiaID",
      "Invalid status",
      "Baseline invalid validation"
    ]);
    expect(screen.getByText("Tripos")).toBeInTheDocument();
    expect(screen.getByText(/AphiaID resolves to another taxon/)).toBeInTheDocument();
  });

  it("switches to subordinate AphiaID columns and highlights former multi-Aphia rows", async () => {
    const user = userEvent.setup();
    render(<RiskPanels candidates={candidates} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Subordinate AphiaID/ }));

    expect(tableHeaders()).toEqual([
      "ID",
      "Dataset",
      "Label",
      "Images",
      "Selected AphiaIDs",
      "Terminal taxa",
      "Terminal ranks"
    ]);
    expect(screen.getByText("Taxon one")).toBeInTheDocument();
    expect(screen.getByText("Taxon two")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Multiple valid/ })).toHaveClass("subordinate-original-multiple");
    expect(screen.getByRole("row", { name: /Bellerochea/ })).not.toHaveClass("subordinate-original-multiple");
  });

  it("switches to multiple and juvenile special-tag columns", async () => {
    const user = userEvent.setup();
    render(<RiskPanels candidates={candidates} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /^Multiple$/ }));

    expect(tableHeaders()).toEqual([
      "ID",
      "Dataset",
      "Label",
      "Images",
      "Selected AphiaID",
      "Terminal taxa",
      "Terminal ranks",
      "Original label"
    ]);
    expect(screen.getAllByText("Pennate Diatom colony").length).toBeGreaterThan(0);
    expect(screen.queryByText("Multiple valid")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Juvenile/ }));

    expect(screen.getAllByText("Crustacea larvae").length).toBeGreaterThan(0);
    expect(screen.queryByText("Pennate Diatom colony")).not.toBeInTheDocument();
  });

  it("switches to broad class mapping columns and calls onSelect for rows", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<RiskPanels candidates={candidates} onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: /Broad class/ }));

    expect(tableHeaders()).toEqual([
      "ID",
      "Dataset",
      "Label",
      "Images",
      "Broad class",
      "Original label",
      "Broad AphiaID",
      "Source"
    ]);

    await user.click(screen.getByRole("row", { name: /Crustacea broad/ }));
    expect(onSelect).toHaveBeenCalledWith("flow::broad");
  });

  it("uses corrected-specific review columns", async () => {
    const user = userEvent.setup();
    render(<RiskPanels candidates={candidates} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Corrected/ }));

    expect(tableHeaders()).toEqual([
      "ID",
      "Dataset",
      "Label",
      "Images",
      "Original AphiaID",
      "Corrected AphiaID",
      "Accepted name",
      "Accepted ID",
      "Correction evidence"
    ]);
    expect(screen.getByText("Neoceratium furca")).toBeInTheDocument();
    expect(screen.getByText("Tripos furca")).toBeInTheDocument();
  });

  it("uses challenged-specific rollup review columns", async () => {
    const user = userEvent.setup();
    render(<RiskPanels candidates={candidates} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Challenged/ }));

    expect(tableHeaders()).toEqual([
      "ID",
      "Dataset",
      "Label",
      "Images",
      "Original AphiaID",
      "Rollup AphiaID",
      "Rollup taxon",
      "Rollup rank",
      "Challenge evidence"
    ]);
    expect(screen.getByText("Dissodinium pseudolunula")).toBeInTheDocument();
    expect(screen.getByText("Pyrocystaceae")).toBeInTheDocument();
  });

  it("shows an empty state for a risk with no candidates", async () => {
    const user = userEvent.setup();
    render(<RiskPanels candidates={candidates.filter((row) => row.special_tags !== "dwc_record_review")} onSelect={vi.fn()} />);

    expect(screen.getByText("No candidates currently carry this tag or flag")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Contaminated/ }));
    expect(screen.queryByText("No candidates currently carry this tag or flag")).not.toBeInTheDocument();
  });
});
