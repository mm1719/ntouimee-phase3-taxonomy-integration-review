# NTOU IMEE Phase 3 Valid Class Taxonomy

Interactive taxonomy tree prototype for the phase 3 valid-class lineage study.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Data

The app reads static study exports from `public/data/` and resized sample thumbnails from `public/samples/`. Original local image paths are not exposed; sample metadata keeps relative `source_ref` values for traceability.

## Demo Data Flow

Current demo data is generated from the phase 3 study outputs, then copied into this Vite app as static files:

1. `scripts/study_valid_class_taxonomy_visualization.py` reads:
   - `studies/label_aphia_inventory/worms_label_aphia_validation_labels.csv`
   - `studies/label_aphia_inventory/tara_pacific_dwca_aphia_coverage.csv`
   - `studies/dataset_class_counts/*_class_counts.csv`
2. The script writes the canonical visualization outputs to `studies/valid_class_taxonomy_visualization/`, including:
   - `valid_class_candidates.csv`
   - `taxonomy_tree.json`
   - `taxonomy_lineage_report.md`
   - `round1_invalid_label_cleanup.md` under `studies/label_aphia_inventory/`
3. The current demo uses copied static data under `public/data/`:
   - `public/data/taxonomy_tree.json`
   - `public/data/valid_class_candidates.csv`
   - `public/data/class_image_samples.json`
4. `scripts/build_valid_class_demo_samples.py` builds `class_image_samples.json` and thumbnail files under `public/samples/` from the analysis-ready manifests.
5. The React app fetches `/data/taxonomy_tree.json`, `/data/valid_class_candidates.csv`, and `/data/class_image_samples.json` at runtime.

`studies/label_aphia_inventory/worms_invalid_labels_for_review.*` is a manual review report, not a frontend data source. A label can be listed for review while still appearing in the demo when it is a contaminated or otherwise risk-flagged valid-tree candidate.

Round 1 cleanup adds two display-only promotion paths to the demo:

- Synonym corrections use the accepted WoRMS AphiaID and display labels as `accepted/original`, such as `Chaetoceros peruvianum/peruvianus`.
- Tara Pacific broad-class promotions display labels as `broad class: original label`, use the broad-class AphiaID for tree placement, and add the `Broad class` risk flag.
