import { Download, FileUp, History, Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { MappingHistory, MappingRuleRow, MappingStatusData, MappingTarget } from "../types";
import { parseCsv } from "../utils/csv";

type Props = {
  data: MappingStatusData;
};

type Mode = "view" | "edit";

type ImportedRule = {
  action?: string;
  source_id?: string;
  target_id?: string;
  source_alias?: string;
  target_alias?: string;
  notes?: string;
};

const EXPORT_FIELDS = ["action", "source_id", "target_id", "source_alias", "target_alias", "notes"];

function blankRule(target: MappingTarget): MappingRuleRow {
  return {
    action: "keep",
    source_id: target.source_id,
    target_id: "",
    source_alias: target.source_alias,
    target_alias: "",
    notes: "",
    validation_status: "ok",
    validation_message: ""
  };
}

function normalizeAction(value: string): MappingRuleRow["action"] {
  const action = value.trim().toLowerCase();
  if (action === "merge" || action === "drop" || action === "keep") return action;
  return "keep";
}

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function aliasSort(value: string) {
  return value
    .split("")
    .map((char) => `${char.toLocaleLowerCase()}:${char === char.toLocaleLowerCase() ? "0" : "1"}:${char}`)
    .join("|");
}

export function MappingStatusReview({ data }: Props) {
  const targetsById = useMemo(
    () => new Map(data.targets.map((target) => [target.source_id, target])),
    [data.targets]
  );
  const fallbackLatestHistory = data.histories.length > 0 ? data.histories[data.histories.length - 1] : null;
  const latestHistory = data.histories.find((history) => history.history_id === data.latest_history_id)
    ?? fallbackLatestHistory;
  const [mode, setMode] = useState<Mode>("view");
  const [historyId, setHistoryId] = useState(latestHistory?.history_id ?? "");
  const [draftRows, setDraftRows] = useState<MappingRuleRow[]>(() =>
    data.targets.map((target) => blankRule(target))
  );
  const [importError, setImportError] = useState("");
  const [queries, setQueries] = useState(["", "", ""]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeHistory = data.histories.find((history) => history.history_id === historyId)
    ?? latestHistory;
  const viewRows: MappingRuleRow[] = activeHistory?.rows ?? data.targets.map((target) => blankRule(target));
  const rows: MappingRuleRow[] = mode === "view" ? viewRows : draftRows;
  const sortedRows = useMemo(() => {
    const normalizedQueries = queries
      .map((query) => query.trim().toLocaleLowerCase())
      .filter(Boolean);
    return [...rows]
      .filter((row) => {
        if (normalizedQueries.length === 0) return true;
        const target = targetsById.get(row.source_id);
        const haystack = [
          row.action,
          row.source_id,
          row.target_id,
          row.source_alias,
          row.target_alias,
          row.notes,
          target?.valid_statuses,
          target?.invalid_reasons,
          target?.risk_flags,
          target?.dataset_ids,
          target?.source_labels
        ].join(" ").toLocaleLowerCase();
        return normalizedQueries.some((query) => haystack.includes(query));
      })
      .sort((left, right) => aliasSort(left.source_alias).localeCompare(aliasSort(right.source_alias)));
  }, [queries, rows, targetsById]);
  const selectedRow = selectedSourceId
    ? rows.find((row) => row.source_id === selectedSourceId)
    : undefined;
  const selectedTarget = selectedRow ? targetsById.get(selectedRow.source_id) : undefined;
  const mergeErrors = rows.filter(
    (row) => row.action === "merge" && row.validation_status !== "ok"
  );
  const explicitRows = rows.filter((row) => row.action === "merge" || row.action === "drop");

  function validateRow(row: MappingRuleRow): MappingRuleRow {
    const source = targetsById.get(row.source_id);
    if (!source) {
      return {
        ...row,
        validation_status: "invalid_source_id",
        validation_message: "source_id is not present in current ML-ready targets"
      };
    }
    const action = normalizeAction(row.action);
    if (action === "drop") {
      return {
        ...row,
        action,
        target_id: "",
        target_alias: "",
        validation_status: "ok",
        validation_message: ""
      };
    }
    if (action === "keep" || row.target_id === row.source_id) {
      return {
        ...row,
        action: "keep",
        target_id: "",
        target_alias: "",
        validation_status: "ok",
        validation_message: ""
      };
    }
    const target = targetsById.get(row.target_id);
    return {
      ...row,
      action: "merge",
      target_alias: target?.source_alias ?? "",
      validation_status: target ? "ok" : "invalid_target_id",
      validation_message: target ? "" : "target_id is not present in current ML-ready targets"
    };
  }

  function startEditFromCurrent() {
    setDraftRows(viewRows.map((row) => ({ ...row })));
    setImportError("");
    setMode("edit");
  }

  function updateDraft(sourceId: string, patch: Partial<MappingRuleRow>) {
    setDraftRows((current) =>
      current.map((row) => (
        row.source_id === sourceId ? validateRow({ ...row, ...patch }) : row
      ))
    );
  }

  function updateQuery(index: number, value: string) {
    setQueries((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  }

  async function importCsv(file: File) {
    const text = await file.text();
    const rawRows = parseCsv<ImportedRule>(text);
    const next = new Map(data.targets.map((target) => [target.source_id, blankRule(target)]));
    const missingSources = new Set<string>();
    rawRows.forEach((raw) => {
      const sourceId = raw.source_id?.trim() ?? "";
      if (!targetsById.has(sourceId)) {
        if (sourceId) missingSources.add(sourceId);
        return;
      }
      const source = targetsById.get(sourceId)!;
      next.set(
        sourceId,
        validateRow({
          action: normalizeAction(raw.action ?? "keep"),
          source_id: sourceId,
          target_id: raw.target_id?.trim() ?? "",
          source_alias: source.source_alias,
          target_alias: "",
          notes: raw.notes?.trim() ?? "",
          validation_status: "ok",
          validation_message: ""
        })
      );
    });
    if (missingSources.size > 0) {
      setImportError(`Import blocked: source_id not found (${Array.from(missingSources).join(", ")})`);
      return;
    }
    setDraftRows(Array.from(next.values()));
    setImportError("");
    setMode("edit");
  }

  function exportCsv() {
    const exportRows = rows.filter((row) => row.action === "merge" || row.action === "drop");
    const csv = [
      EXPORT_FIELDS.join(","),
      ...exportRows.map((row) =>
        EXPORT_FIELDS.map((field) => csvCell(String(row[field as keyof MappingRuleRow] ?? ""))).join(",")
      )
    ].join("\n") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `manual_mapping_rules_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <aside className="filters mapping-sidebar">
        <section className="section-first">
          <h2><History size={16} /> Mode</h2>
          <div className="vertical-segmented">
            <button className={mode === "view" ? "active" : ""} onClick={() => setMode("view")}>
              View latest/history
            </button>
            <button className={mode === "edit" ? "active" : ""} onClick={startEditFromCurrent}>
              Edit draft
            </button>
          </div>
        </section>

        <section>
          <h2>Search</h2>
          <div className="multi-search" aria-label="Mapping search filters">
            {queries.map((value, index) => (
              <div className="searchbox" key={index}>
                <Search size={16} />
                <input
                  value={value}
                  onChange={(event) => updateQuery(index, event.target.value)}
                  aria-label={`Mapping search term ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>History</h2>
          <select
            value={historyId}
            onChange={(event) => {
              setHistoryId(event.target.value);
              setMode("view");
            }}
          >
            {data.histories.map((history) => (
              <option key={history.history_id} value={history.history_id}>
                {history.file_name}
              </option>
            ))}
          </select>
          <p className="muted">
            Latest is resolved from checked-in CSV files under {data.history_dir}.
          </p>
        </section>

        <section>
          <h2>Import / export</h2>
          <input
            ref={fileInputRef}
            className="hidden-input"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importCsv(file);
              event.currentTarget.value = "";
            }}
          />
          <button className="ghost-button full-button" onClick={() => fileInputRef.current?.click()}>
            <FileUp size={16} />
            Import CSV
          </button>
          <button
            className="primary-button full-button"
            disabled={mode !== "edit" || mergeErrors.length > 0}
            onClick={exportCsv}
          >
            <Download size={16} />
            Export CSV
          </button>
          {importError && <p className="error-text">{importError}</p>}
          {mergeErrors.length > 0 && (
            <p className="error-text">
              {mergeErrors.length} merge row(s) have unresolved target_id values.
            </p>
          )}
        </section>
      </aside>

      <main className="tree-panel mapping-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Mapping status</p>
            <h2>{mode === "view" ? activeHistory?.file_name ?? "No history" : "Editable draft"}</h2>
          </div>
          <div className="mapping-metrics">
            <span><strong>{data.target_count.toLocaleString()}</strong> classes</span>
            <span><strong>{explicitRows.length.toLocaleString()}</strong> merge/drop</span>
            <span><strong>{mergeErrors.length.toLocaleString()}</strong> errors</span>
          </div>
        </div>

        <datalist id="mapping-target-ids">
          {data.targets.map((target) => (
            <option key={target.source_id} value={target.source_id}>
              {target.source_alias}
            </option>
          ))}
        </datalist>

        <div className="table-wrap dense-table mapping-table">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Source ID</th>
                <th>Target ID</th>
                <th>Source alias</th>
                <th>Target alias</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr
                  key={row.source_id}
                  className={[
                    selectedSourceId === row.source_id ? "selected-row" : "",
                    row.validation_status !== "ok" ? "error-row" : ""
                  ].filter(Boolean).join(" ")}
                  onClick={() => setSelectedSourceId(row.source_id)}
                >
                  <td>
                    {mode === "edit" ? (
                      <select
                        className="action-select"
                        value={row.action}
                        onChange={(event) => updateDraft(row.source_id, { action: event.target.value as MappingRuleRow["action"] })}
                      >
                        <option value="keep">keep</option>
                        <option value="merge">merge</option>
                        <option value="drop">drop</option>
                      </select>
                    ) : (
                      <span className={`action-badge action-${row.action}`}>{row.action}</span>
                    )}
                  </td>
                  <td><code>{row.source_id}</code></td>
                  <td>
                    {mode === "edit" && row.action === "merge" ? (
                      <input
                        className="table-input"
                        list="mapping-target-ids"
                        value={row.target_id}
                        onChange={(event) => updateDraft(row.source_id, { target_id: event.target.value })}
                      />
                    ) : row.target_id ? <code>{row.target_id}</code> : ""}
                  </td>
                  <td className="wrap-cell strong-cell">{row.source_alias}</td>
                  <td className={row.validation_status !== "ok" ? "error-text wrap-cell" : "wrap-cell"}>
                    {row.validation_status === "ok" ? row.target_alias : row.validation_message}
                  </td>
                  <td>
                    {mode === "edit" ? (
                      <textarea
                        className="table-textarea"
                        value={row.notes}
                        onChange={(event) => updateDraft(row.source_id, { notes: event.target.value })}
                      />
                    ) : (
                      <span className="wrap-cell">{row.notes}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {selectedRow && (
        <aside className="drawer">
          <div className="drawer-header">
            <div>
              <p className="eyebrow">Class detail</p>
              <h2>{selectedRow.source_alias}</h2>
            </div>
            <button className="icon-button" onClick={() => setSelectedSourceId(null)} aria-label="Close class detail drawer">
              <X size={18} />
            </button>
          </div>
          <dl className="kv">
            <div><dt>Source ID</dt><dd><code>{selectedRow.source_id}</code></dd></div>
            <div><dt>Action</dt><dd>{selectedRow.action}</dd></div>
            <div><dt>Target ID</dt><dd>{selectedRow.target_id || "n/a"}</dd></div>
            <div><dt>Target alias</dt><dd>{selectedRow.target_alias || "n/a"}</dd></div>
            <div><dt>Images</dt><dd>{(selectedTarget?.image_count ?? 0).toLocaleString()}</dd></div>
            <div><dt>Status</dt><dd>{selectedTarget?.valid_statuses ?? "n/a"}</dd></div>
            <div><dt>Datasets</dt><dd>{selectedTarget?.dataset_ids ?? "n/a"}</dd></div>
            <div><dt>Source labels</dt><dd>{selectedTarget?.source_labels ?? "n/a"}</dd></div>
            <div><dt>Notes</dt><dd>{selectedRow.notes || "n/a"}</dd></div>
          </dl>
        </aside>
      )}
    </>
  );
}
