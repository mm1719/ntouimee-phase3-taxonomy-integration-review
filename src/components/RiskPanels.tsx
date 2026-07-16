import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { RiskBadge, SpecialTagBadge } from "./Badges";
import { datasetLabel } from "../data/constants";
import type { Candidate } from "../types";
import { splitCell } from "../utils/csv";

type Props = {
  candidates: Candidate[];
  onSelect: (entryId: string) => void;
};

type ReviewKey =
  | "dwc_record_review"
  | "multiple"
  | "juvenile"
  | "contaminated"
  | "subordinate_aphia_id"
  | "broad_class"
  | "corrected"
  | "challenged";

const REVIEW_KEYS: ReviewKey[] = [
  "dwc_record_review",
  "multiple",
  "juvenile",
  "contaminated",
  "subordinate_aphia_id",
  "broad_class",
  "corrected",
  "challenged"
];

const SPECIAL_REVIEW_KEYS = new Set<ReviewKey>([
  "dwc_record_review",
  "multiple",
  "juvenile"
]);

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

function reviewColumns(activeKey: ReviewKey) {
  const common = [
    helper.display({
      id: "row_id",
      header: "ID",
      cell: (info) => info.row.index + 1
    }),
    helper.accessor("dataset_id", {
      header: "Dataset",
      cell: (info) => datasetLabel(info.getValue())
    }),
    helper.accessor("label", { header: "Label" }),
    helper.accessor("image_count", {
      header: "Images",
      cell: (info) => Number(info.getValue()).toLocaleString()
    })
  ];

  if (activeKey === "dwc_record_review") {
    return [
      ...common,
      helper.accessor("selected_aphia_ids", {
        header: "Selected AphiaID",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("dwca_review_aphia_ids", {
        header: "Review DwC ID",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("dwca_aphia_ids", {
        header: "All DwC IDs",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("dwca_review_reasons", {
        header: "Review reason",
        cell: (info) => <TextCell value={info.getValue()} />
      })
    ];
  }

  if (activeKey === "contaminated") {
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
        header: "Baseline invalid validation",
        cell: (info) => <TextCell value={info.getValue()} />
      })
    ];
  }

  if (activeKey === "corrected") {
    return [
      ...common,
      helper.accessor("worms_aphia_ids", {
        header: "Original AphiaID",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("selected_aphia_ids", {
        header: "Corrected AphiaID",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("accepted_name", {
        header: "Accepted name",
        cell: (info) => <TextCell value={info.getValue()} />
      }),
      helper.accessor("accepted_aphia_id", {
        header: "Accepted ID",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("synonym_note", {
        header: "Correction evidence",
        cell: (info) => <TextCell value={info.getValue()} />
      })
    ];
  }

  if (activeKey === "challenged") {
    return [
      ...common,
      helper.accessor("worms_aphia_ids", {
        header: "Original AphiaID",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("status_review_rollup_aphia_id", {
        header: "Rollup AphiaID",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("status_review_rollup_name", {
        header: "Rollup taxon",
        cell: (info) => <TextCell value={info.getValue()} />
      }),
      helper.accessor("status_review_rollup_rank", {
        header: "Rollup rank",
        cell: (info) => <TextCell value={info.getValue()} />
      }),
      helper.accessor("synonym_note", {
        header: "Challenge evidence",
        cell: (info) => <TextCell value={info.getValue()} />
      })
    ];
  }

  if (activeKey === "multiple" || activeKey === "juvenile") {
    return [
      ...common,
      helper.accessor("selected_aphia_ids", {
        header: "Selected AphiaID",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("terminal_worms_names", {
        header: "Terminal taxa",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("terminal_ranks", {
        header: "Terminal ranks",
        cell: (info) => <ListCell value={info.getValue()} />
      }),
      helper.accessor("original_label", { header: "Original label" })
    ];
  }

  if (activeKey === "subordinate_aphia_id") {
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
  const [activeKey, setActiveKey] = useState<ReviewKey>("dwc_record_review");
  const [sorting, setSorting] = useState<SortingState>([]);

  const rows = useMemo(
    () =>
      candidates.filter((row) =>
        [...splitCell(row.risk_flags), ...splitCell(row.special_tags)].includes(activeKey)
      ),
    [activeKey, candidates]
  );

  const columns = useMemo(() => reviewColumns(activeKey), [activeKey]);

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
          <h2>Tag & flag review panels</h2>
        </div>
        <div className="segmented">
          {REVIEW_KEYS.map((risk) => (
            <button
              key={risk}
              className={risk === activeKey ? "active" : ""}
              onClick={() => setActiveKey(risk)}
            >
              {SPECIAL_REVIEW_KEYS.has(risk) ? (
                <SpecialTagBadge tag={risk} />
              ) : (
                <RiskBadge risk={risk} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap dense-table">
        <p className="muted panel-note">
          {rows.length.toLocaleString()} dataset-class entries require review for this tag or flag.
        </p>
        {rows.length === 0 ? (
          <div className="empty-state compact-empty">
            <p className="eyebrow">No rows</p>
            <h3>No candidates currently carry this tag or flag</h3>
            <p>No candidates currently carry this review tag or flag.</p>
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
                <tr
                  key={row.original.entry_id}
                  className={
                    activeKey === "subordinate_aphia_id" &&
                    splitCell(row.original.selected_aphia_ids).length > 1
                      ? "subordinate-original-multiple"
                      : ""
                  }
                  onClick={() => onSelect(row.original.entry_id)}
                >
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
