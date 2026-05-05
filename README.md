# Valid Class Taxonomy Demo

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
