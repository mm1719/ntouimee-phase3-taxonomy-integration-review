import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState
} from "@tanstack/react-table";
import { Images, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DatasetBadge } from "./Badges";
import type { DatasetId, InvalidLabelData, InvalidLabelGroup } from "../types";
import { DATASET_LABELS, DATASETS } from "../data/constants";

type InvalidTableKey = "non_taxonomic_category" | "taxonomic_mismatch";

type Props = {
  data: InvalidLabelData;
  selected: InvalidLabelGroup | null;
  onSelect: (group: InvalidLabelGroup) => void;
  onOpenSamples: (sampleKey: string) => void;
};

const TABLES: Array<{ key: InvalidTableKey; label: string }> = [
  { key: "non_taxonomic_category", label: "Non-Taxonomic Category" },
  { key: "taxonomic_mismatch", label: "Taxonomic Mismatch" }
];

const helper = createColumnHelper<InvalidLabelGroup>();

function aliasSort(value: string) {
  return value
    .split("")
    .map((char) => `${char.toLocaleLowerCase()}:${char === char.toLocaleLowerCase() ? "0" : "1"}:${char}`)
    .join("|");
}

export function InvalidLabelsReview({ data, selected, onSelect, onOpenSamples }: Props) {
  const [activeTable, setActiveTable] = useState<InvalidTableKey>("non_taxonomic_category");
  const [query, setQuery] = useState("");
  const [datasets, setDatasets] = useState<Set<DatasetId>>(new Set(DATASETS));
  const [showValidTreeOverlap, setShowValidTreeOverlap] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return data.tables[activeTable]
      .filter((group) => showValidTreeOverlap || !group.include_valid_tree_overlap)
      .filter((group) => group.dataset_ids.some((dataset) => datasets.has(dataset)))
      .filter((group) => {
        if (!normalizedQuery) return true;
        const haystack = [
          ...group.aliases,
          ...group.dataset_ids,
          ...group.datasets.flatMap((dataset) => [
            ...dataset.aliases,
            ...dataset.reasons,
            ...dataset.source_examples
          ])
        ].join(" ").toLocaleLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => aliasSort(a.aliases[0] ?? a.group_key).localeCompare(aliasSort(b.aliases[0] ?? b.group_key)));
  }, [activeTable, data.tables, datasets, query, showValidTreeOverlap]);

  const columns = useMemo(
    () => [
      helper.accessor((row) => row.aliases.join(" / "), {
        id: "aliases",
        header: "Aliases",
        cell: (info) => <span className="strong-cell">{info.getValue()}</span>
      }),
      helper.accessor("total_image_count", {
        header: "Total",
        cell: (info) => info.getValue().toLocaleString()
      }),
      ...DATASETS.map((dataset) =>
        helper.accessor(
          (row) => row.datasets.find((item) => item.dataset_id === dataset)?.image_count ?? 0,
          {
            id: dataset,
            header: DATASET_LABELS[dataset],
            cell: (info) => info.getValue().toLocaleString()
          }
        )
      ),
      helper.display({
        id: "datasets",
        header: "Datasets",
        cell: (info) => (
          <div className="stack">
            {info.row.original.dataset_ids.map((dataset) => <DatasetBadge key={dataset} id={dataset} />)}
          </div>
        )
      }),
      helper.display({
        id: "samples",
        header: "Samples",
        cell: (info) => (
          <button
            className="icon-button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenSamples(info.row.original.sample_key);
            }}
            aria-label={`Open samples for ${info.row.original.aliases.join(", ")}`}
          >
            <Images size={15} />
          </button>
        )
      })
    ],
    [onOpenSamples]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  function toggleDataset(dataset: DatasetId) {
    setDatasets((current) => {
      const next = new Set(current);
      if (next.has(dataset)) next.delete(dataset);
      else next.add(dataset);
      return next;
    });
  }

  return (
    <>
      <aside className="filters">
        <div className="searchbox">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search aliases, reasons, sources"
          />
        </div>

        <section>
          <h2>Invalid tables</h2>
          <div className="vertical-segmented">
            {TABLES.map((table) => (
              <button
                key={table.key}
                className={activeTable === table.key ? "active" : ""}
                onClick={() => setActiveTable(table.key)}
              >
                {table.label} ({data.tables[table.key].length})
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>Datasets</h2>
          {DATASETS.map((dataset) => (
            <label className="check-row" key={dataset}>
              <input
                type="checkbox"
                checked={datasets.has(dataset)}
                onChange={() => toggleDataset(dataset)}
              />
              {DATASET_LABELS[dataset]}
            </label>
          ))}
        </section>

        <section>
          <label className="switch-row">
            <input
              type="checkbox"
              checked={showValidTreeOverlap}
              onChange={(event) => setShowValidTreeOverlap(event.target.checked)}
            />
            Show valid-tree overlaps
          </label>
          <p className="muted">
            Default view excludes labels already represented in the valid taxonomy tree.
          </p>
        </section>
      </aside>

      <main className="tree-panel invalid-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Invalid labels</p>
            <h2>{TABLES.find((table) => table.key === activeTable)?.label}</h2>
          </div>
          <p className="muted">
            {rows.length.toLocaleString()} grouped rows · sorted case-insensitively by alias
          </p>
        </div>

        <div className="table-wrap dense-table">
          <table>
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.original.sample_key}
                  className={selected?.sample_key === row.original.sample_key ? "selected-row" : ""}
                  onClick={() => onSelect(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
