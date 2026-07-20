import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { DatasetId, InvalidLabelData, InvalidLabelGroup } from "../types";
import { datasetLabel, datasetSort } from "../data/constants";
import { InstrumentDatasetFilters } from "./InstrumentDatasetFilters";

type InvalidTableKey = "non_taxonomic_category" | "taxonomic_mismatch";

type Props = {
  data: InvalidLabelData;
  selected: InvalidLabelGroup | null;
  datasetLabels?: Record<DatasetId, string>;
  datasetInstruments?: Record<DatasetId, string>;
  onSelect: (group: InvalidLabelGroup) => void;
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

export function InvalidLabelsReview({
  data,
  selected,
  datasetLabels = {},
  datasetInstruments = {},
  onSelect
}: Props) {
  const [activeTable, setActiveTable] = useState<InvalidTableKey>("non_taxonomic_category");
  const [queries, setQueries] = useState(["", "", ""]);
  const datasetOptions = useMemo(
    () => [...new Set(
      Object.values(data.tables).flatMap((groups) =>
        groups.flatMap((group) => group.dataset_ids)
      )
    )].sort(datasetSort),
    [data.tables]
  );
  const [datasets, setDatasets] = useState<Set<DatasetId>>(new Set(datasetOptions));
  const [showValidTreeOverlap, setShowValidTreeOverlap] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [tableScale, setTableScale] = useState(1.1);

  const rows = useMemo(() => {
    const normalizedQueries = queries
      .map((query) => query.trim().toLocaleLowerCase())
      .filter(Boolean);
    return data.tables[activeTable]
      .filter((group) => showValidTreeOverlap || !group.include_valid_tree_overlap)
      .filter((group) => group.dataset_ids.some((dataset) => datasets.has(dataset)))
      .filter((group) => {
        if (normalizedQueries.length === 0) return true;
        const haystack = [
          group.pseudo_aphia_id,
          group.group_key,
          group.sample_key,
          ...group.aliases,
          ...group.dataset_ids,
          ...group.datasets.flatMap((dataset) => [
            ...dataset.aliases,
            ...dataset.reasons,
            ...dataset.source_examples
          ])
        ].join(" ").toLocaleLowerCase();
        return normalizedQueries.some((query) => haystack.includes(query));
      })
      .sort((a, b) => aliasSort(a.aliases[0] ?? a.group_key).localeCompare(aliasSort(b.aliases[0] ?? b.group_key)));
  }, [activeTable, data.tables, datasets, queries, showValidTreeOverlap]);

  const columns = useMemo(
    () => [
      helper.display({
        id: "row_id",
        header: "ID",
        cell: (info) => info.row.index + 1
      }),
      helper.accessor("pseudo_aphia_id", {
        header: "Pseudo AphiaID",
        cell: (info) => <code>{info.getValue()}</code>
      }),
      helper.accessor((row) => row.aliases.join(" / "), {
        id: "aliases",
        header: "Aliases",
        cell: (info) => (
          <div className="alias-list">
            {info.row.original.aliases.map((alias) => (
              <span className="alias-token strong-cell" key={alias}>{alias}</span>
            ))}
          </div>
        )
      }),
      helper.accessor("total_image_count", {
        header: "Images",
        cell: (info) => info.getValue().toLocaleString()
      }),
      ...datasetOptions.map((dataset) =>
        helper.accessor(
          (row) => row.datasets.find((item) => item.dataset_id === dataset)?.image_count ?? 0,
          {
            id: dataset,
            header: datasetLabel(dataset, datasetLabels),
            cell: (info) => info.getValue().toLocaleString()
          }
        )
      )
    ],
    [datasetLabels, datasetOptions]
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

  function toggleDatasets(group: DatasetId[], enabled: boolean) {
    setDatasets((current) => {
      const next = new Set(current);
      group.forEach((dataset) => enabled ? next.add(dataset) : next.delete(dataset));
      return next;
    });
  }

  function updateQuery(index: number, value: string) {
    setQueries((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  }

  return (
    <>
      <aside className="filters">
        <div className="multi-search" aria-label="Invalid search filters">
          {queries.map((value, index) => (
            <div className="searchbox" key={index}>
              <Search size={16} />
              <input
                value={value}
                onChange={(event) => updateQuery(index, event.target.value)}
                aria-label={`Invalid search term ${index + 1}`}
              />
            </div>
          ))}
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
          <InstrumentDatasetFilters
            options={datasetOptions}
            selected={datasets}
            instruments={datasetInstruments}
            labels={datasetLabels}
            onToggle={toggleDataset}
            onToggleMany={toggleDatasets}
          />
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
            Rows already represented in the valid taxonomy tree are included by default and highlighted for review.
          </p>
        </section>
      </aside>

      <main className="tree-panel invalid-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Invalid labels</p>
            <h2>{TABLES.find((table) => table.key === activeTable)?.label}</h2>
          </div>
          <div className="panel-actions">
            <p className="muted">
              {rows.length.toLocaleString()} grouped rows · sorted case-insensitively by alias
            </p>
            <div className="tree-toolbar compact-toolbar">
              <span className="muted">Table text</span>
              <button onClick={() => setTableScale((value) => Math.max(1, value - 0.08))}>A-</button>
              <button onClick={() => setTableScale(1.1)}>Reset</button>
              <button onClick={() => setTableScale((value) => Math.min(1.54, value + 0.08))}>A+</button>
            </div>
          </div>
        </div>

        <div className="table-wrap dense-table" style={{ fontSize: `${tableScale}rem` }}>
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
                  className={[
                    selected?.sample_key === row.original.sample_key ? "selected-row" : "",
                    row.original.include_valid_tree_overlap ? "overlap-row" : ""
                  ].filter(Boolean).join(" ")}
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
