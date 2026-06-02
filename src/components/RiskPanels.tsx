import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { RiskBadge } from "./Badges";
import { DATASET_LABELS } from "../data/constants";
import type { Candidate } from "../types";
import { splitCell } from "../utils/csv";

type Props = {
  candidates: Candidate[];
  onSelect: (entryId: string) => void;
};

type RiskKey =
  | "dwca_aphia_mismatch"
  | "contaminated"
  | "multiple_valid_aphia_ids"
  | "broad_class";

const RISKS: RiskKey[] = [
  "dwca_aphia_mismatch",
  "contaminated",
  "multiple_valid_aphia_ids",
  "broad_class"
];

const helper = createColumnHelper<Candidate>();

function ListCell({ value }: { value: string }) {
  const values = splitCell(value);
  if (values.length === 0) return <span className="muted">n/a</span>;
  return (
    <div className="alias-list compact-list">
      {values.map((item) => (
        <span className="alias-token" key={item}>{item}</span>
      ))}
    </div>
  );
}

function TextCell({ value }: { value: string }) {
  return value ? <span className="path-text">{value}</span> : <span className="muted">n/a</span>;
}

function riskColumns(activeRisk: RiskKey) {
  const common = [
    helper.display({
      id: "row_id",
      header: "ID",
      cell: (info) => info.row.index + 1
    }),
    helper.accessor("dataset_id", {
      header: "Dataset",
      cell: (info) => DATASET_LABELS[info.getValue()] ?? info.getValue()
    }),
    helper.accessor("label", { header: "Label" }),
    helper.accessor("image_count", {
      header: "Images",
      cell: (info) => Number(info.getValue()).toLocaleString()
    })
  ];

  if (activeRisk === "dwca_aphia_mismatch") {
    return [
      ...common,
      helper.accessor("selected_aphia_ids", {
        header: "Selected AphiaID",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("dwca_aphia_ids", {
        header: "DwC scientificNameID",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("selected_aphia_source", { header: "Source priority" }),
      helper.accessor("terminal_ranks", {
        header: "Terminal rank",
        cell: (info) => <ListCell value={info.getValue()} />
      })
    ];
  }

  if (activeRisk === "contaminated") {
    return [
      ...common,
      helper.accessor("selected_aphia_ids", {
        header: "Selected AphiaID",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("invalid_statuses", {
        header: "Invalid status",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("contaminated_sources", {
        header: "Invalid evidence",
        cell: (info) => <TextCell value={info.getValue()} />
      })
    ];
  }

  if (activeRisk === "multiple_valid_aphia_ids") {
    return [
      ...common,
      helper.accessor("selected_aphia_ids", {
        header: "Selected AphiaIDs",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("terminal_worms_names", {
        header: "Terminal taxa",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("terminal_ranks", {
        header: "Terminal ranks",
        cell: (info) => <ListCell value={info.getValue()} />
      })
    ];
  }

  return [
    ...common,
    helper.accessor("broad_class", { header: "Broad class" }),
    helper.accessor("broad_class_original_label", { header: "Original label" }),
    helper.accessor("broad_class_aphia_id", {
      header: "Broad AphiaID",
      cell: (info) => <ListCell value={info.getValue()} />
    }),
    helper.accessor("broad_class_source_file", {
      header: "Source",
      cell: (info) => <TextCell value={info.getValue()} />
    })
  ];
}

export function RiskPanels({ candidates, onSelect }: Props) {
  const [activeRisk, setActiveRisk] = useState<RiskKey>("dwca_aphia_mismatch");
  const [sorting, setSorting] = useState<SortingState>([]);

  const rows = useMemo(
    () => candidates.filter((row) => splitCell(row.risk_flags).includes(activeRisk)),
    [activeRisk, candidates]
  );

  const columns = useMemo(() => riskColumns(activeRisk), [activeRisk]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Review</p>
          <h2>Risk review panels</h2>
        </div>
        <div className="segmented">
          {RISKS.map((risk) => (
            <button
              key={risk}
              className={risk === activeRisk ? "active" : ""}
              onClick={() => setActiveRisk(risk)}
            >
              <RiskBadge risk={risk} />
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap dense-table">
        <p className="muted panel-note">
          {rows.length.toLocaleString()} dataset-class entries require review for this risk.
        </p>
        {rows.length === 0 ? (
          <div className="empty-state compact-empty">
            <p className="eyebrow">No rows</p>
            <h3>No candidates currently carry this risk flag</h3>
          </div>
        ) : (
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
                <tr key={row.original.entry_id} onClick={() => onSelect(row.original.entry_id)}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
