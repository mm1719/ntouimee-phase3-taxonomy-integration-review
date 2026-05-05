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
import type { Candidate } from "../types";

type Props = {
  candidates: Candidate[];
  onSelect: (entryId: string) => void;
};

const helper = createColumnHelper<Candidate>();

export function RiskPanels({ candidates, onSelect }: Props) {
  const [activeRisk, setActiveRisk] = useState("dwca_aphia_mismatch");
  const [sorting, setSorting] = useState<SortingState>([]);

  const rows = useMemo(
    () => candidates.filter((row) => row.risk_flags.split("|").includes(activeRisk)),
    [activeRisk, candidates]
  );

  const columns = useMemo(
    () => [
      helper.accessor("dataset_id", { header: "Dataset" }),
      helper.accessor("label", { header: "Label" }),
      helper.accessor("image_count", {
        header: "Images",
        cell: (info) => Number(info.getValue()).toLocaleString()
      }),
      helper.accessor("selected_aphia_ids", { header: "Selected AphiaID" }),
      helper.accessor("dwca_aphia_ids", { header: "DwC AphiaID" }),
      helper.accessor("terminal_ranks", { header: "Terminal rank" })
    ],
    []
  );

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
          {["dwca_aphia_mismatch", "contaminated", "multiple_valid_aphia_ids"].map((risk) => (
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

      <div className="table-wrap">
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
              <tr key={row.id} onClick={() => onSelect(row.original.entry_id)}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
