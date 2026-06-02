import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

const tree = {
  type: "root",
  name: "Root",
  image_count: 615,
  entry_count: 3,
  dataset_class_entry_count: 3,
  unique_selected_aphia_id_count: 2,
  unique_candidate_image_count: 615,
  children: [
    {
      type: "taxon",
      name: "Animalia",
      rank: "Kingdom",
      aphia_id: "2",
      image_count: 15,
      entry_count: 2,
      datasets: ["flowcam_net", "tara_pacific_deck"],
      risk_flags: ["broad_class"],
      lineage_notes: [],
      children: [
        {
          type: "taxon",
          name: "Crustacea",
          rank: "Subphylum",
          aphia_id: "1066",
          image_count: 10,
          entry_count: 1,
          datasets: ["tara_pacific_deck"],
          risk_flags: ["broad_class"],
          lineage_notes: ["intermediate_rank"],
          children: [
            {
              type: "dataset_class",
              name: "Crustacea broad",
              entry_id: "tara_pacific_deck::Crustacea broad",
              placement_id: "tara_pacific_deck::Crustacea broad::1066",
              dataset_id: "tara_pacific_deck",
              dataset_label: "Tara Pacific Deck",
              original_label: "Crustacea broad",
              selected_aphia_id: "1066",
              selected_aphia_source: "round2_broad_class_mapping",
              broad_class: "Crustacea",
              broad_class_original_label: "Crustacea broad",
              broad_class_aphia_id: "1066",
              broad_class_source_file: "studies/label_aphia_inventory/round2_invalid_label_cleanup.csv",
              rank: "Subphylum",
              image_count: 10,
              entry_count: 1,
              risk_flags: ["broad_class"],
              lineage_notes: ["intermediate_rank"],
              children: []
            }
          ]
        },
        {
          type: "taxon",
          name: "Copepoda",
          rank: "Class",
          aphia_id: "1080",
          image_count: 5,
          entry_count: 1,
          datasets: ["flowcam_net"],
          risk_flags: [],
          lineage_notes: [],
          children: [
            {
              type: "dataset_class",
              name: "Copepoda",
              entry_id: "flowcam_net::Copepoda",
              placement_id: "flowcam_net::Copepoda::1080",
              dataset_id: "flowcam_net",
              dataset_label: "FlowCAMNet",
              original_label: "Copepoda",
              selected_aphia_id: "1080",
              selected_aphia_source: "worms_name_assignment",
              rank: "Class",
              image_count: 5,
              entry_count: 1,
              risk_flags: [],
              lineage_notes: [],
              children: []
            }
          ]
        }
      ]
    },
    {
      type: "taxon",
      name: "Chromista",
      rank: "Kingdom",
      aphia_id: "4",
      image_count: 600,
      entry_count: 1,
      datasets: ["life_watch"],
      risk_flags: ["contaminated"],
      lineage_notes: [],
      children: [
        {
          type: "taxon",
          name: "Tripos",
          rank: "Genus",
          aphia_id: "109485",
          image_count: 600,
          entry_count: 1,
          datasets: ["life_watch"],
          risk_flags: ["contaminated"],
          lineage_notes: [],
          children: [
            {
              type: "dataset_class",
              name: "Tripos",
              entry_id: "life_watch::Tripos",
              placement_id: "life_watch::Tripos::109485",
              dataset_id: "life_watch",
              dataset_label: "LifeWatch",
              original_label: "Tripos",
              selected_aphia_id: "109485",
              selected_aphia_source: "local_aphia_id_validation",
              contaminated_sources: "Taxonomic Mismatch: 1 -> wrong taxon",
              rank: "Genus",
              image_count: 600,
              entry_count: 1,
              risk_flags: ["contaminated"],
              lineage_notes: [],
              children: []
            }
          ]
        }
      ]
    }
  ]
};

const candidatesCsv = [
  "entry_id,dataset_id,label,original_label,image_count,selected_aphia_ids,selected_aphia_source,terminal_worms_names,terminal_ranks,lineage_notes,risk_flags,contaminated_sources,validation_statuses,invalid_statuses,worms_aphia_ids,dwca_aphia_ids,worms_record_urls,synonym_note,accepted_name,accepted_aphia_id,broad_class,broad_class_original_label,broad_class_aphia_id,broad_class_source_file,source_example",
  "tara_pacific_deck::Crustacea broad,tara_pacific_deck,Crustacea broad,Crustacea broad,10,1066,round2_broad_class_mapping,Crustacea,Subphylum,intermediate_rank,broad_class,,Invalid,Non-Taxonomic Category,1066,,https://www.marinespecies.org/aphia.php?p=taxdetails&id=1066,,,,Crustacea,Crustacea broad,1066,studies/label_aphia_inventory/round2_invalid_label_cleanup.csv,deck.tsv",
  "flowcam_net::Copepoda,flowcam_net,Copepoda,Copepoda,5,1080,worms_name_assignment,Copepoda,Class,,,,Valid,,1080,,https://www.marinespecies.org/aphia.php?p=taxdetails&id=1080,,,,,,,,flowcam.csv",
  "life_watch::Tripos,life_watch,Tripos,Tripos,600,109485,local_aphia_id_validation,Tripos,Genus,,contaminated,Taxonomic Mismatch: 1 -> wrong taxon,Valid,Taxonomic Mismatch,109485,,https://www.marinespecies.org/aphia.php?p=taxdetails&id=109485,,,,,,,,lifewatch.csv"
].join("\n");

const samples = {
  "tara_pacific_deck::Crustacea broad": [
    {
      dataset_id: "tara_pacific_deck",
      label: "Crustacea broad",
      image_id: "deck-1",
      thumbnail_url: "/samples/tara_pacific_deck/crustacea.jpg",
      source_ref: "derived/cleaned/tara_pacific_deck_scale_bar_removed/images/crustacea.png",
      width: "120",
      height: "88"
    }
  ],
  "flowcam_net::Copepoda": [
    {
      dataset_id: "flowcam_net",
      label: "Copepoda",
      image_id: "flow-1",
      thumbnail_url: "/samples/flowcam_net/copepoda.jpg",
      source_ref: "derived/staging/flowcam_net/copepoda.jpg",
      width: "90",
      height: "90"
    }
  ],
  "life_watch::Tripos": [
    {
      dataset_id: "life_watch",
      label: "Tripos",
      image_id: "life-1",
      thumbnail_url: "/samples/life_watch/tripos.jpg",
      source_ref: "datasets/LifeWatch/tripos.jpg",
      width: "100",
      height: "100"
    }
  ]
};

const invalid = {
  tables: {
    non_taxonomic_category: [
      {
        group_key: "artefact",
        sample_key: "non_taxonomic_category::artefact",
        aliases: ["artefact"],
        status: "Non-Taxonomic Category",
        dataset_ids: ["flowcam_net"],
        total_image_count: 12,
        include_valid_tree_overlap: false,
        datasets: [
          {
            dataset_id: "flowcam_net",
            aliases: ["artefact"],
            image_count: 12,
            reasons: ["Strict rule: artefact is non-taxonomic"],
            source_examples: ["flowcam_invalid.csv"],
            worms_sources: ["query=artefact"],
            valid_tree_entry: "no"
          }
        ]
      },
      {
        group_key: "tripos",
        sample_key: "non_taxonomic_category::tripos",
        aliases: ["Tripos"],
        status: "Non-Taxonomic Category",
        dataset_ids: ["life_watch"],
        total_image_count: 600,
        include_valid_tree_overlap: true,
        datasets: [
          {
            dataset_id: "life_watch",
            aliases: ["Tripos"],
            image_count: 600,
            reasons: ["Contaminated valid-tree overlap"],
            source_examples: ["lifewatch_invalid.csv"],
            worms_sources: ["query=Tripos"],
            valid_tree_entry: "yes"
          }
        ]
      }
    ],
    taxonomic_mismatch: [
      {
        group_key: "bad_aphia",
        sample_key: "taxonomic_mismatch::bad_aphia",
        aliases: ["bad_aphia"],
        status: "Taxonomic Mismatch",
        dataset_ids: ["tara_pacific_bongo"],
        total_image_count: 7,
        include_valid_tree_overlap: false,
        datasets: [
          {
            dataset_id: "tara_pacific_bongo",
            aliases: ["bad_aphia"],
            image_count: 7,
            reasons: ["AphiaID 1 resolves to wrong taxon"],
            source_examples: ["bongo_invalid.tsv"],
            worms_sources: ["AphiaID 1"],
            valid_tree_entry: "no"
          }
        ]
      }
    ]
  },
  samples: {
    "non_taxonomic_category::artefact": [
      {
        dataset_id: "flowcam_net",
        label: "artefact",
        image_id: "bad-1",
        thumbnail_url: "/invalid-samples/non_taxonomic_category/artefact.jpg",
        source_ref: "derived/staging/flowcam_net/artefact.jpg",
        width: "50",
        height: "50"
      }
    ],
    "taxonomic_mismatch::bad_aphia": [
      {
        dataset_id: "tara_pacific_bongo",
        label: "bad_aphia",
        image_id: "bad-2",
        thumbnail_url: "/invalid-samples/taxonomic_mismatch/bad_aphia.jpg",
        source_ref: "derived/cleaned/tara_pacific_bongo_scale_bar_removed/bad.png",
        width: "70",
        height: "70"
      }
    ]
  },
  summary: {
    source: "fixture",
    sample_limit_per_dataset: 5,
    excluded_valid_tree_overlap_default: true,
    table_counts: {
      non_taxonomic_category: 2,
      taxonomic_mismatch: 1
    },
    table_image_counts: {
      non_taxonomic_category: 612,
      taxonomic_mismatch: 7
    },
    total_image_count: 619
  }
};

function mockFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith("/data/taxonomy_tree.json")) {
      return new Response(JSON.stringify(tree), { status: 200 });
    }
    if (url.endsWith("/data/valid_class_candidates.csv")) {
      return new Response(candidatesCsv, { status: 200 });
    }
    if (url.endsWith("/data/class_image_samples.json")) {
      return new Response(JSON.stringify(samples), { status: 200 });
    }
    if (url.endsWith("/data/invalid_label_groups.json")) {
      return new Response(JSON.stringify(invalid), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  });
}

async function renderApp(path = "/valid") {
  window.history.pushState(null, "", path);
  mockFetch();
  render(<App />);
  await screen.findByRole("heading", { name: "Taxonomy Integration Review" });
}

beforeEach(() => {
  vi.restoreAllMocks();
  window.history.pushState(null, "", "/valid");
});

describe("App valid tree UI", () => {
  it("loads the valid route with summary stats and default controls", async () => {
    await renderApp("/valid");

    expect(screen.getByText("Entries")).toBeInTheDocument();
    expect(screen.getByText("AphiaIDs")).toBeInTheDocument();
    expect(screen.getByText("Placements")).toBeInTheDocument();
    expect(screen.getAllByText("Images").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Valid tree" })).toHaveClass("active");
    expect(screen.getByLabelText("Show intermediate ranks")).toBeChecked();
  });

  it("opens and closes terminology help", async () => {
    const user = userEvent.setup();
    await renderApp("/valid");

    await user.click(screen.getByRole("button", { name: "Open terminology help" }));
    expect(screen.getByRole("dialog", { name: "Terminology help" })).toBeInTheDocument();
    expect(screen.getByText("Risk flags")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close help" }));
    expect(screen.queryByRole("dialog", { name: "Terminology help" })).not.toBeInTheDocument();
  });

  it("clears the tree for an unknown search without returning to loading", async () => {
    const user = userEvent.setup();
    await renderApp("/valid");

    await user.type(screen.getByPlaceholderText("Search label, taxon, AphiaID"), "missing-value");

    expect(screen.getByText("Tree cleared by current filters")).toBeInTheDocument();
    expect(screen.queryByText("Loading taxonomy data...")).not.toBeInTheDocument();
  });

  it("filters the valid tree by risk and dataset", async () => {
    const user = userEvent.setup();
    await renderApp("/valid");

    await user.click(screen.getByLabelText(/Broad class/));
    expect(screen.getByText("Crustacea")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /LifeWatch Tripos/ })).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Tara Pacific Deck"));
    expect(screen.queryByRole("button", { name: /Crustacea broad/ })).not.toBeInTheDocument();
  });

  it("selects a tree node, opens the detail drawer, and opens samples", async () => {
    const user = userEvent.setup();
    await renderApp("/valid");

    await user.click(screen.getByText("Expand all"));
    await user.click(screen.getByRole("button", { name: /Crustacea broad/i }));

    expect(screen.getByText("Dataset-class entry")).toBeInTheDocument();
    expect(screen.getByText("Broad class mapping")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Open 1 sample thumbnails/i }));
    expect(screen.getAllByRole("heading", { name: "Crustacea broad" }).length).toBeGreaterThan(0);
    expect(screen.getByText("deck-1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Back to taxonomy/i }));
    expect(screen.getByText("WoRMS lineage structure")).toBeInTheDocument();
  });

  it("uses tree text controls and expand/default controls without losing the tree", async () => {
    const user = userEvent.setup();
    await renderApp("/valid");

    await user.click(screen.getByRole("button", { name: "A+" }));
    await user.click(screen.getByRole("button", { name: "A-" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await user.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getByRole("button", { name: /Copepoda/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Default open" }));
    expect(screen.getByText("WoRMS lineage structure")).toBeInTheDocument();
  });
});

describe("App invalid labels UI", () => {
  it("loads the invalid route with summary stats", async () => {
    await renderApp("/invalid");

    expect(screen.getByRole("button", { name: "Invalid labels" })).toHaveClass("active");
    expect(screen.getByText("Non-taxonomic")).toBeInTheDocument();
    expect(screen.getByText("Mismatch")).toBeInTheDocument();
    expect(screen.getByText("Total invalid")).toBeInTheDocument();
    expect(screen.getByText("Invalid images")).toBeInTheDocument();
  });

  it("navigates between valid and invalid routes", async () => {
    const user = userEvent.setup();
    await renderApp("/valid");

    await user.click(screen.getByRole("button", { name: "Invalid labels" }));
    expect(screen.getByRole("heading", { name: "Non-Taxonomic Category" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/invalid");

    await user.click(screen.getByRole("button", { name: "Valid tree" }));
    expect(screen.getByRole("heading", { name: "WoRMS lineage structure" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/valid");
  });

  it("filters invalid labels by query and dataset", async () => {
    const user = userEvent.setup();
    await renderApp("/invalid");

    expect(screen.getByText("artefact")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Search aliases, reasons, sources"), "no-match");
    expect(screen.queryByText("artefact")).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Search aliases, reasons, sources"));
    await user.click(screen.getByLabelText("FlowCAMNet"));
    expect(screen.queryByText("artefact")).not.toBeInTheDocument();
  });

  it("shows valid-tree overlaps only when the toggle is enabled", async () => {
    const user = userEvent.setup();
    await renderApp("/invalid");

    expect(screen.queryByRole("button", { name: /LifeWatch Tripos/ })).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Show valid-tree overlaps"));
    expect(screen.getByText("Tripos")).toBeInTheDocument();
  });

  it("switches invalid tables, opens drawer, and opens invalid samples", async () => {
    const user = userEvent.setup();
    await renderApp("/invalid");

    await user.click(screen.getByRole("button", { name: /Taxonomic Mismatch/ }));
    expect(screen.getByText("bad_aphia")).toBeInTheDocument();

    await user.click(screen.getByText("bad_aphia"));
    expect(screen.getByText("Invalid label group")).toBeInTheDocument();
    expect(screen.getByText("AphiaID 1 resolves to wrong taxon")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Open 1 sample thumbnails/i }));
    expect(screen.getAllByRole("heading", { name: "bad_aphia" }).length).toBeGreaterThan(0);
    expect(screen.getByText("bad-2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Back to invalid labels/i }));
    expect(screen.getByRole("heading", { name: "Taxonomic Mismatch" })).toBeInTheDocument();
  });

  it("closes invalid drawer and adjusts invalid table text controls", async () => {
    const user = userEvent.setup();
    await renderApp("/invalid");

    await user.click(screen.getByText("artefact"));
    expect(screen.getByText("Invalid label group")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close detail drawer" }));
    expect(screen.queryByText("Invalid label group")).not.toBeInTheDocument();

    const panel = screen.getByRole("heading", { name: "Non-Taxonomic Category" }).closest("main")!;
    await user.click(within(panel).getByRole("button", { name: "A+" }));
    await user.click(within(panel).getByRole("button", { name: "A-" }));
    await user.click(within(panel).getByRole("button", { name: "Reset" }));
    expect(screen.getByText("artefact")).toBeInTheDocument();
  });
});
