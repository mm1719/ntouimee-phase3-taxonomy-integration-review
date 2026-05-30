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
    () => {
      const filtered = candidates.filter((row) => row.risk_flags.split("|").includes(activeRisk));
      if (activeRisk !== "broad_class") return filtered;
      const seenBroadClasses = new Set<string>();
      return [...filtered]
        .sort((a, b) => Number(b.image_count) - Number(a.image_count))
        .filter((row) => {
          const broadClass = row.broad_class || "unknown";
          if (seenBroadClasses.has(broadClass)) return false;
          seenBroadClasses.add(broadClass);
          return true;
        })
        .slice(0, 6);
    },
    [activeRisk, candidates]
  );

  const columns = useMemo(
    () => {
      const baseColumns = [
        helper.accessor("dataset_id", { header: "Dataset" }),
        helper.accessor("label", { header: "Label" }),
        helper.accessor("image_count", {
          header: "Images",
          cell: (info) => Number(info.getValue()).toLocaleString()
        }),
        helper.accessor("selected_aphia_ids", { header: "Selected AphiaID" })
      ];
      if (activeRisk === "contaminated") {
        baseColumns.push(
          helper.accessor("contaminated_sources", { header: "Invalid evidence" })
        );
      }
      baseColumns.push(
        helper.accessor("dwca_aphia_ids", {
          header: activeRisk === "broad_class" ? "Broad AphiaID" : "DwC AphiaID",
          cell: (info) => {
            const row = info.row.original;
            if (activeRisk === "broad_class") return row.broad_class_aphia_id || "";
            return info.getValue();
          }
        }),
        helper.accessor("broad_class", { header: "Broad class" }),
        helper.accessor("terminal_ranks", { header: "Terminal rank" })
      );
      return baseColumns;
    },
    [activeRisk]
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
          {["dwca_aphia_mismatch", "contaminated", "multiple_valid_aphia_ids", "broad_class"].map((risk) => (
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
        {activeRisk === "broad_class" && (
          <p className="muted panel-note">
            Showing up to six examples, with one row per broad class.
          </p>
        )}
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
