import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DetailDrawer } from "../DetailDrawer";
import type { Candidate, TreeNode } from "../../types";

const challengedCandidate: Candidate = {
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

const correctedCandidate: Candidate = {
  ...challengedCandidate,
  entry_id: "flowcam_net::Neoceratium furca",
  dataset_id: "flowcam_net",
  label: "Neoceratium furca",
  original_label: "Neoceratium furca",
  image_count: "387",
  selected_aphia_ids: "840627",
  selected_aphia_source: "worms_status_corrected",
  terminal_worms_names: "Tripos furca",
  terminal_ranks: "Species",
  risk_flags: "corrected",
  worms_aphia_ids: "495659",
  worms_record_urls: "https://www.marinespecies.org/aphia.php?p=taxdetails&id=840627",
  synonym_note: "WoRMS status review: 495659:Neoceratium furca -> 840627:Tripos furca",
  accepted_name: "Tripos furca",
  accepted_aphia_id: "840627",
  status_review_flag: "corrected",
  status_review_rollup_aphia_id: "",
  status_review_rollup_name: "",
  status_review_rollup_rank: "",
  status_review_evidence_json: JSON.stringify([
    {
      source: "original",
      aphia_id: "495659",
      name: "Neoceratium furca",
      rank: "Species",
      status: "unaccepted",
      valid_aphia_id: "840627",
      valid_name: "Tripos furca"
    },
    {
      source: "valid_target",
      aphia_id: "840627",
      name: "Tripos furca",
      rank: "Species",
      status: "accepted",
      valid_aphia_id: "840627",
      valid_name: "Tripos furca"
    },
    {
      source: "synonym_of_840627",
      aphia_id: "1637442",
      name: "Biceratium debile",
      rank: "Species",
      status: "unaccepted",
      valid_aphia_id: "840627",
      valid_name: "Tripos furca"
    }
  ])
};

const algaebaseBackedCandidate = {
  ...challengedCandidate,
  selected_aphia_ids: "110325",
  selected_aphia_source: "worms_status_challenged_algaebase_keep",
  status_review_rollup_aphia_id: "110325",
  status_review_rollup_name: "Dissodinium pseudolunula",
  status_review_rollup_rank: "Species",
  status_review_external_action: "algaebase_supported_keep_name",
  status_review_external_evidence_json: JSON.stringify([
    {
      source: "AlgaeBase via Global Names Verifier source 195",
      record_id: "52283",
      matched_name: "Dissodinium pseudolunula Swift ex Elbrächter & Drebes",
      current_name: "Dissodinium pseudolunula Swift ex Elbrächter & Drebes",
      taxonomic_status: "Accepted",
      url: "https://www.algaebase.org/search/species/detail/?species_id=52283"
    }
  ])
} as Candidate & {
  status_review_external_action: string;
  status_review_external_evidence_json: string;
};

const round12BroadCandidate = {
  ...challengedCandidate,
  entry_id: "life_watch::Rhizosolenia_setigera",
  dataset_id: "life_watch",
  label: "Rhizosolenia: Rhizosolenia_setigera_(f._pungens)+R._hebetata_f._semispina",
  original_label: "Rhizosolenia_setigera_(f._pungens)+R._hebetata_f._semispina",
  image_count: "8800",
  selected_aphia_ids: "149069",
  selected_aphia_source: "round12_loose_upward_broad_class",
  terminal_worms_names: "Rhizosolenia",
  terminal_ranks: "Genus",
  risk_flags: "broad_class",
  status_review_flag: "",
  status_review_evidence_json: "",
  broad_class: "Rhizosolenia",
  broad_class_original_label: "Rhizosolenia_setigera_(f._pungens)+R._hebetata_f._semispina",
  broad_class_aphia_id: "149069",
  broad_class_source_file: "studies/taxonomy_integration_review/label_aphia_mismatch_audit.md",
  broad_class_reason: "Round 12 loose AphiaID match: original label is narrower than the source AphiaID record, so the row is treated as broad class placement."
} as Candidate & { broad_class_reason: string };

const contaminatedCandidate = {
  ...challengedCandidate,
  entry_id: "life_watch::Bellerochea_horologicalis",
  dataset_id: "life_watch",
  label: "Bellerochea_horologicalis",
  original_label: "Bellerochea_horologicalis",
  selected_aphia_ids: "149305",
  risk_flags: "contaminated",
  status_review_flag: "",
  contaminated_sources: "Taxonomic Mismatch: 1066 -> Crustacea"
} as Candidate;

function nodeFor(candidate: Candidate): TreeNode {
  return {
    type: "dataset_class",
    name: candidate.label,
    entry_id: candidate.entry_id,
    dataset_id: candidate.dataset_id,
    original_label: candidate.original_label,
    selected_aphia_id: candidate.selected_aphia_ids,
    selected_aphia_source: candidate.selected_aphia_source,
    image_count: Number(candidate.image_count),
    entry_count: 1,
    risk_flags: splitRiskFlags(candidate.risk_flags),
    children: []
  };
}

function splitRiskFlags(value: string) {
  return value.split("|").filter(Boolean);
}

describe("DetailDrawer", () => {
  it("shows status review evidence with title-case risk labels", () => {
    render(
      <DetailDrawer
        node={nodeFor(challengedCandidate)}
        candidate={challengedCandidate}
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

  it("shows only original and accepted target evidence for corrected entries", () => {
    render(
      <DetailDrawer
        node={nodeFor(correctedCandidate)}
        candidate={correctedCandidate}
        samples={[]}
        sampleMap={{}}
        invalidSampleMap={{}}
        invalidGroups={[]}
        onClose={vi.fn()}
        onOpenSamples={vi.fn()}
        onOpenInvalidSamples={vi.fn()}
      />
    );

    expect(screen.getByText("Corrected")).toBeInTheDocument();
    expect(screen.getByText("WoRMS correction review")).toBeInTheDocument();
    expect(screen.getAllByText("Neoceratium furca").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tripos furca").length).toBeGreaterThan(0);
    expect(screen.queryByText("Biceratium debile")).not.toBeInTheDocument();
  });

  it("shows the single AlgaeBase backing reference for challenged entries", () => {
    render(
      <DetailDrawer
        node={nodeFor(algaebaseBackedCandidate)}
        candidate={algaebaseBackedCandidate}
        samples={[]}
        sampleMap={{}}
        invalidSampleMap={{}}
        invalidGroups={[]}
        onClose={vi.fn()}
        onOpenSamples={vi.fn()}
        onOpenInvalidSamples={vi.fn()}
      />
    );

    expect(screen.getByText("AlgaeBase backing")).toBeInTheDocument();
    expect(screen.getByText("algaebase_supported_keep_name")).toBeInTheDocument();
    expect(screen.getByText("Dissodinium pseudolunula Swift ex Elbrächter & Drebes")).toBeInTheDocument();
    expect(screen.getByText("https://www.algaebase.org/search/species/detail/?species_id=52283")).toBeInTheDocument();
  });

  it("shows the round 12 broad-class reason in the drawer", () => {
    render(
      <DetailDrawer
        node={nodeFor(round12BroadCandidate)}
        candidate={round12BroadCandidate}
        samples={[]}
        sampleMap={{}}
        invalidSampleMap={{}}
        invalidGroups={[]}
        onClose={vi.fn()}
        onOpenSamples={vi.fn()}
        onOpenInvalidSamples={vi.fn()}
      />
    );

    expect(screen.getByText("Broad class mapping")).toBeInTheDocument();
    expect(screen.getByText(/original label is narrower than the source AphiaID record/)).toBeInTheDocument();
  });

  it("opens selected-AphiaID valid samples for contaminated entries", () => {
    const onOpenSamples = vi.fn();
    render(
      <DetailDrawer
        node={nodeFor(contaminatedCandidate)}
        candidate={contaminatedCandidate}
        samples={[{ dataset_id: "life_watch", label: "fallback", image_id: "1", thumbnail_url: "/samples/a.jpg", source_ref: "a.jpg", width: "1", height: "1" }]}
        sampleMap={{
          "life_watch::Bellerochea_horologicalis::aphia::149305": [
            { dataset_id: "life_watch", label: "selected", image_id: "2", thumbnail_url: "/samples/b.jpg", source_ref: "b.jpg", width: "1", height: "1" },
            { dataset_id: "life_watch", label: "selected", image_id: "3", thumbnail_url: "/samples/c.jpg", source_ref: "c.jpg", width: "1", height: "1" }
          ]
        }}
        invalidSampleMap={{}}
        invalidGroups={[]}
        onClose={vi.fn()}
        onOpenSamples={onOpenSamples}
        onOpenInvalidSamples={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Valid evidence thumbnails (2)"));
    expect(onOpenSamples).toHaveBeenCalledWith("life_watch::Bellerochea_horologicalis::aphia::149305");
  });
});
