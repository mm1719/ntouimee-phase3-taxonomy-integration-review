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
  dataset_labels: {
    flowcam_net: "FlowCAMNet",
    tara_pacific_deck: "Tara Pacific Deck",
    life_watch: "LifeWatch",
    whoi_plankton: "WHOI Plankton",
    syke_ifcb: "SYKE IFCB",
    medplanktonset: "MedPlanktonSet"
  },
  dataset_instruments: {
    flowcam_net: "FlowCAM",
    tara_pacific_deck: "FlowCAM",
    life_watch: "FlowCAM",
    whoi_plankton: "IFCB",
    syke_ifcb: "IFCB",
    medplanktonset: "IFCB"
  },
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
          lineage_notes: [],
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
              lineage_notes: [],
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
  "entry_id,dataset_id,label,original_label,image_count,selected_aphia_ids,selected_aphia_image_counts,selected_aphia_source,valid_image_count,invalid_image_count,terminal_worms_names,terminal_ranks,lineage_notes,risk_flags,special_tags,contaminated_sources,validation_statuses,invalid_statuses,worms_aphia_ids,dwca_aphia_ids,worms_record_urls,synonym_note,accepted_name,accepted_aphia_id,broad_class,broad_class_original_label,broad_class_aphia_id,broad_class_source_file,source_example",
  "tara_pacific_deck::Crustacea broad,tara_pacific_deck,Crustacea broad,Crustacea broad,10,1066,10,round2_broad_class_mapping,10,0,Crustacea,Subphylum,,broad_class,,,Invalid,Non-Taxonomic Category,1066,,https://www.marinespecies.org/aphia.php?p=taxdetails&id=1066,,,,Crustacea,Crustacea broad,1066,studies/label_aphia_inventory/round2_invalid_label_cleanup.csv,deck.tsv",
  "flowcam_net::Copepoda,flowcam_net,Copepoda,Copepoda,5,1080,5,worms_name_assignment,5,0,Copepoda,Class,,,,,Valid,,1080,,https://www.marinespecies.org/aphia.php?p=taxdetails&id=1080,,,,,,,,flowcam.csv",
  "life_watch::Tripos,life_watch,Tripos,Tripos,600,109485,600,local_aphia_id_validation,600,600,Tripos,Genus,,contaminated,,Taxonomic Mismatch: 1 -> wrong taxon,Valid,Taxonomic Mismatch,109485,,https://www.marinespecies.org/aphia.php?p=taxdetails&id=109485,,,,,,,,lifewatch.csv"
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
        pseudo_aphia_id: "ntc_002",
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
        pseudo_aphia_id: "inv_999",
        sample_key: "non_taxonomic_category::tripos",
        aliases: ["Tripos"],
        status: "Non-Taxonomic Category",
        dataset_ids: ["life_watch"],
        total_image_count: 600,
        include_valid_tree_overlap: true,
        valid_image_count: 600,
        invalid_image_count: 600,
        datasets: [
          {
            dataset_id: "life_watch",
            aliases: ["Tripos"],
            image_count: 600,
            valid_image_count: 600,
            invalid_image_count: 600,
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
        pseudo_aphia_id: "tm_001",
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
    "non_taxonomic_category::tripos": [
      {
        dataset_id: "life_watch",
        label: "Tripos",
        image_id: "bad-tripos",
        thumbnail_url: "/invalid-samples/non_taxonomic_category/tripos.jpg",
        source_ref: "datasets/LifeWatch/tripos_invalid.jpg",
        width: "60",
        height: "60"
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
    sample_limit_per_dataset: 8,
    excluded_valid_tree_overlap_default: true,
    table_counts: {
      non_taxonomic_category: 2,
      taxonomic_mismatch: 1
    },
    table_image_counts: {
      non_taxonomic_category: 612,
      taxonomic_mismatch: 7
    },
    evidence_table_total_image_count: 619,
    total_image_count_semantics: "unique_dataset_invalid_group_image_union",
    total_image_count: 607
  }
};

const mappingStatus = {
  generated_at_utc: "2026-06-14T00:00:00+00:00",
  source_targets: "derived/ml_ready/target_profiles.csv",
  history_dir: "derived/ml_ready/mapping_history",
  export_fields: ["action", "source_id", "target_id", "source_alias", "target_alias", "notes"],
  target_count: 3,
  targets: [
    {
      source_id: "ntc_002",
      source_alias: "artefact",
      image_count: 12,
      valid_statuses: "invalid",
      invalid_reasons: "non_taxonomic_category",
      risk_flags: "n/a",
      special_tags: "n/a",
      dataset_ids: "flowcam_net",
      source_labels: "artefact"
    },
    {
      source_id: "ntc_053",
      source_alias: "othertocheck",
      image_count: 30,
      valid_statuses: "invalid",
      invalid_reasons: "non_taxonomic_category",
      risk_flags: "n/a",
      special_tags: "n/a",
      dataset_ids: "tara_pacific_deck",
      source_labels: "othertocheck"
    },
    {
      source_id: "1080",
      source_alias: "Copepoda",
      image_count: 5,
      valid_statuses: "valid",
      invalid_reasons: "n/a",
      risk_flags: "n/a",
      special_tags: "n/a",
      dataset_ids: "flowcam_net",
      source_labels: "Copepoda"
    }
  ],
  latest_history_id: "round6_manual",
  histories: [
    {
      history_id: "round6_manual",
      file_name: "2026-06-14_manual_mapping_rules.csv",
      path: "derived/ml_ready/mapping_history/2026-06-14_manual_mapping_rules.csv",
      row_count: 3,
      explicit_row_count: 1,
      merge_count: 1,
      drop_count: 0,
      warning_count: 0,
      warnings: [],
      rows: [
        {
          action: "merge",
          source_id: "ntc_002",
          target_id: "ntc_053",
          source_alias: "artefact",
          target_alias: "othertocheck",
          notes: "fixture merge",
          validation_status: "ok",
          validation_message: ""
        },
        {
          action: "keep",
          source_id: "ntc_053",
          target_id: "",
          source_alias: "othertocheck",
          target_alias: "",
          notes: "",
          validation_status: "ok",
          validation_message: ""
        },
        {
          action: "keep",
          source_id: "1080",
          target_id: "",
          source_alias: "Copepoda",
          target_alias: "",
          notes: "",
          validation_status: "ok",
          validation_message: ""
        }
      ]
    }
  ]
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
    if (url.endsWith("/data/mapping_status.json")) {
      return new Response(JSON.stringify(mappingStatus), { status: 200 });
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
    expect(screen.queryByLabelText("Show intermediate ranks")).not.toBeInTheDocument();
  });

  it("opens and closes terminology help", async () => {
    const user = userEvent.setup();
    await renderApp("/valid");

    await user.click(screen.getByRole("button", { name: "Open terminology help" }));
    const dialog = screen.getByRole("dialog", { name: "Terminology help" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Risk flags")).toBeInTheDocument();
    expect(within(dialog).getByText("Corrected")).toBeInTheDocument();
    expect(within(dialog).getByText("Challenged")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close help" }));
    expect(screen.queryByRole("dialog", { name: "Terminology help" })).not.toBeInTheDocument();
  });

  it("clears the tree for an unknown search without returning to loading", async () => {
    const user = userEvent.setup();
    await renderApp("/valid");

    await user.type(screen.getByLabelText("Search term 1"), "missing-value");

    expect(screen.getByText("Tree cleared by current filters")).toBeInTheDocument();
    expect(screen.queryByText("Loading taxonomy data...")).not.toBeInTheDocument();
  });

  it("uses OR semantics across the three valid search fields", async () => {
    const user = userEvent.setup();
    await renderApp("/valid");

    await user.type(screen.getByLabelText("Search term 1"), "missing-value");
    await user.type(screen.getByLabelText("Search term 2"), "copepoda");

    expect(screen.getByRole("button", { name: /Copepoda/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Crustacea broad/i })).not.toBeInTheDocument();
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

  it("toggles all datasets under an instrument parent", async () => {
    const user = userEvent.setup();
    await renderApp("/valid");

    expect(screen.getByLabelText("WHOI Plankton")).toBeChecked();
    expect(screen.getByLabelText("SYKE IFCB")).toBeChecked();
    expect(screen.getByLabelText("MedPlanktonSet")).toBeChecked();

    await user.click(screen.getByLabelText("IFCB datasets"));

    expect(screen.getByLabelText("WHOI Plankton")).not.toBeChecked();
    expect(screen.getByLabelText("SYKE IFCB")).not.toBeChecked();
    expect(screen.getByLabelText("MedPlanktonSet")).not.toBeChecked();
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

  it("opens contaminated invalid evidence thumbnails from the valid drawer", async () => {
    const user = userEvent.setup();
    await renderApp("/valid");

    await user.click(screen.getByText("Expand all"));
    await user.click(screen.getByRole("button", { name: /Tripos/i }));

    expect(screen.getByText("Baseline invalid validation")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Invalid evidence thumbnails: Non-Taxonomic Category \(1\)/i }));
    expect(screen.getAllByRole("heading", { name: "Tripos" }).length).toBeGreaterThan(0);
    expect(screen.getByText("bad-tripos")).toBeInTheDocument();
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
    expect(screen.getByText("607")).toBeInTheDocument();
    expect(screen.queryByText("619")).not.toBeInTheDocument();
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
    await user.type(screen.getByLabelText("Invalid search term 1"), "no-match");
    expect(screen.queryByText("artefact")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Invalid search term 1"));
    await user.type(screen.getByLabelText("Invalid search term 2"), "ntc_002");
    expect(screen.getByText("artefact")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Invalid search term 2"));
    await user.click(screen.getByLabelText("FlowCAMNet"));
    expect(screen.queryByText("artefact")).not.toBeInTheDocument();
  });

  it("shows valid-tree overlaps by default and can hide them", async () => {
    const user = userEvent.setup();
    await renderApp("/invalid");

    expect(screen.getByText("Tripos")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Show valid-tree overlaps"));
    expect(screen.queryByRole("button", { name: /LifeWatch Tripos/ })).not.toBeInTheDocument();
  });

  it("switches invalid tables, opens drawer, and opens invalid samples", async () => {
    const user = userEvent.setup();
    await renderApp("/invalid");

    await user.click(screen.getByRole("button", { name: /Taxonomic Mismatch/ }));
    expect(screen.getByText("bad_aphia")).toBeInTheDocument();

    await user.click(screen.getByText("bad_aphia"));
    expect(screen.getByText("Invalid label group")).toBeInTheDocument();
    expect(screen.getAllByText("tm_001").length).toBeGreaterThan(0);
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
    expect(screen.queryByText("flowcam_invalid.csv")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show source references" }));
    expect(screen.getByText("flowcam_invalid.csv")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close detail drawer" }));
    expect(screen.queryByText("Invalid label group")).not.toBeInTheDocument();

    const panel = screen.getByRole("heading", { name: "Non-Taxonomic Category" }).closest("main")!;
    await user.click(within(panel).getByRole("button", { name: "A+" }));
    await user.click(within(panel).getByRole("button", { name: "A-" }));
    await user.click(within(panel).getByRole("button", { name: "Reset" }));
    expect(screen.getByText("artefact")).toBeInTheDocument();
  });
});

describe("App mapping status UI", () => {
  it("loads mapping status in view mode", async () => {
    await renderApp("/mapping");

    expect(screen.getByRole("button", { name: "Mapping status" })).toHaveClass("active");
    expect(screen.queryByRole("heading", { name: "artefact" })).not.toBeInTheDocument();
    const mappingPanel = screen.getByRole("heading", { name: "2026-06-14_manual_mapping_rules.csv" }).closest("main")!;
    expect(within(mappingPanel).getByText("ntc_002")).toBeInTheDocument();
    const mergeRow = within(mappingPanel).getByText("ntc_002").closest("tr")!;
    await userEvent.click(mergeRow);
    expect(screen.getByRole("heading", { name: "artefact" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close class detail drawer" }));
    expect(screen.queryByRole("heading", { name: "artefact" })).not.toBeInTheDocument();
    expect(within(mergeRow).getByText("othertocheck")).toBeInTheDocument();
    expect(within(mergeRow).getByText("fixture merge")).toBeInTheDocument();
  });

  it("filters mapping status with OR semantics across search fields", async () => {
    const user = userEvent.setup();
    await renderApp("/mapping");

    await user.type(screen.getByLabelText("Mapping search term 1"), "missing-value");
    await user.type(screen.getByLabelText("Mapping search term 3"), "copepoda");

    const mappingPanel = screen.getByRole("heading", { name: "2026-06-14_manual_mapping_rules.csv" }).closest("main")!;
    expect(within(mappingPanel).getByText("1080")).toBeInTheDocument();
    expect(within(mappingPanel).queryByText("ntc_002")).not.toBeInTheDocument();
  });

  it("edits mapping rows and blocks unresolved merge targets", async () => {
    const user = userEvent.setup();
    await renderApp("/mapping");

    await user.click(screen.getByRole("button", { name: "Edit draft" }));
    const mappingPanel = screen.getByRole("heading", { name: "Editable draft" }).closest("main")!;
    const artefactRow = within(mappingPanel).getByText("ntc_002").closest("tr")!;
    const targetInput = within(artefactRow).getByDisplayValue("ntc_053");
    await user.clear(targetInput);
    await user.type(targetInput, "missing_target");

    expect(screen.getByText("target_id is not present in current ML-ready targets")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeDisabled();
  });
});
