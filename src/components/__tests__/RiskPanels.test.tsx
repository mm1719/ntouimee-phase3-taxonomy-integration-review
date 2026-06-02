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
  worms_record_urls: "",
  synonym_note: "",
  accepted_name: "",
  accepted_aphia_id: "",
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
    risk_flags: "dwca_aphia_mismatch",
    dwca_aphia_ids: "999999"
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
    risk_flags: "multiple_valid_aphia_ids"
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
  }
];

function tableHeaders() {
  return screen.getAllByRole("columnheader").map((header) => header.textContent);
}

describe("RiskPanels", () => {
  it("shows DwC mismatch specific columns by default", () => {
    render(<RiskPanels candidates={candidates} onSelect={vi.fn()} />);

    expect(tableHeaders()).toEqual([
      "ID",
      "Dataset",
      "Label",
      "Images",
      "Selected AphiaID",
      "DwC scientificNameID",
      "Source priority",
      "Terminal rank"
    ]);
    expect(screen.getByText("DwC conflict")).toBeInTheDocument();
    expect(screen.getByText("999999")).toBeInTheDocument();
  });

  it("switches to contaminated evidence columns and keeps invalid evidence visible", async () => {
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
      "Invalid evidence"
    ]);
    expect(screen.getByText("Tripos")).toBeInTheDocument();
    expect(screen.getByText(/AphiaID resolves to another taxon/)).toBeInTheDocument();
  });

  it("switches to multiple AphiaID columns", async () => {
    const user = userEvent.setup();
    render(<RiskPanels candidates={candidates} onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Multiple AphiaID/ }));

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

  it("shows an empty state for a risk with no candidates", async () => {
    const user = userEvent.setup();
    render(<RiskPanels candidates={candidates.filter((row) => row.risk_flags !== "dwca_aphia_mismatch")} onSelect={vi.fn()} />);

    expect(screen.getByText("No candidates currently carry this risk flag")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Contaminated/ }));
    expect(screen.queryByText("No candidates currently carry this risk flag")).not.toBeInTheDocument();
  });
});
