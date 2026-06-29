import { useEffect, useMemo, useState } from "react";
import { HelpCircle, Search, SlidersHorizontal } from "lucide-react";
import { DetailDrawer } from "./components/DetailDrawer";
import { HelpModal } from "./components/HelpModal";
import { InvalidDetailDrawer } from "./components/InvalidDetailDrawer";
import { InvalidLabelsReview } from "./components/InvalidLabelsReview";
import { MappingStatusReview } from "./components/MappingStatusReview";
import { RiskPanels } from "./components/RiskPanels";
import { SamplePage } from "./components/SamplePage";
import { TaxonomyTree } from "./components/TaxonomyTree";
import { DATASET_LABELS, DATASETS, RISK_LABELS, SPECIAL_TAG_LABELS } from "./data/constants";
import type { Candidate, DatasetId, InvalidLabelData, InvalidLabelGroup, MappingStatusData, SampleMap, TreeNode } from "./types";
import { parseCsv } from "./utils/csv";
import { collectRanks, filterTree, normalizeTree, type Filters } from "./utils/tree";

type DataState = {
  tree: TreeNode;
  candidates: Candidate[];
  samples: SampleMap;
  invalid: InvalidLabelData;
  mapping: MappingStatusData;
};

type Route = "valid" | "invalid" | "mapping";

function currentRoute(): Route {
  if (window.location.pathname.startsWith("/mapping")) return "mapping";
  return window.location.pathname.startsWith("/invalid") ? "invalid" : "valid";
}

function App() {
  const [data, setData] = useState<DataState | null>(null);
  const [route, setRoute] = useState<Route>(currentRoute());
  const [queries, setQueries] = useState(["", "", ""]);
  const [datasets, setDatasets] = useState<Set<DatasetId>>(new Set(DATASETS));
  const [risks, setRisks] = useState<Set<string>>(new Set());
  const [rank, setRank] = useState("");
  const [treeScale, setTreeScale] = useState(1.19);
  const [expandAllVersion, setExpandAllVersion] = useState(0);
  const [treeResetKey, setTreeResetKey] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [selectedInvalid, setSelectedInvalid] = useState<InvalidLabelGroup | null>(null);
  const [sampleEntry, setSampleEntry] = useState<string | null>(null);
  const [invalidSampleKey, setInvalidSampleKey] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [treeRes, candidatesRes, samplesRes, invalidRes, mappingRes] = await Promise.all([
        fetch("/data/taxonomy_tree.json"),
        fetch("/data/valid_class_candidates.csv"),
        fetch("/data/class_image_samples.json"),
        fetch("/data/invalid_label_groups.json"),
        fetch("/data/mapping_status.json")
      ]);
      const tree = (await treeRes.json()) as TreeNode;
      setData({
        tree: normalizeTree(tree),
        candidates: parseCsv<Candidate>(await candidatesRes.text()),
        samples: await samplesRes.json(),
        invalid: await invalidRes.json(),
        mapping: await mappingRes.json()
      });
    }
    void load();
  }, []);

  useEffect(() => {
    function handlePopState() {
      setRoute(currentRoute());
      setSelected(null);
      setSelectedInvalid(null);
      setSampleEntry(null);
      setInvalidSampleKey(null);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (window.location.pathname === "/") {
      window.history.replaceState(null, "", "/valid");
      setRoute("valid");
    }
  }, []);

  useEffect(() => {
    setTreeResetKey((value) => value + 1);
  }, [queries, datasets, risks, rank]);

  const candidateByEntry = useMemo(() => {
    const map = new Map<string, Candidate>();
    data?.candidates.forEach((candidate) => map.set(candidate.entry_id, candidate));
    return map;
  }, [data]);

  const ranks = useMemo(() => (data ? collectRanks(data.tree) : []), [data]);

  const filters: Filters = useMemo(
    () => ({ queries, datasets, risks, rank }),
    [queries, datasets, risks, rank]
  );

  const visibleTree = useMemo(() => {
    if (!data) return null;
    return filterTree(data.tree, filters)[0] ?? null;
  }, [data, filters]);

  const selectedCandidate =
    selected?.entry_id ? candidateByEntry.get(selected.entry_id) : undefined;
  const selectedSamples = selected?.entry_id && data ? data.samples[selected.entry_id] ?? [] : [];
  const selectedInvalidGroups = useMemo(() => {
    if (!selectedCandidate || !data) return [];
    const labelKeys = new Set([
      selectedCandidate.label.toLocaleLowerCase(),
      selectedCandidate.original_label.toLocaleLowerCase()
    ]);
    return [...data.invalid.tables.non_taxonomic_category, ...data.invalid.tables.taxonomic_mismatch]
      .filter((group) => group.include_valid_tree_overlap)
      .filter((group) => group.dataset_ids.includes(selectedCandidate.dataset_id))
      .filter((group) => group.aliases.some((alias) => labelKeys.has(alias.toLocaleLowerCase())));
  }, [data, selectedCandidate]);

  if (!data) {
    return <div className="loading">Loading taxonomy data...</div>;
  }

  const sampleCandidateKey = sampleEntry?.split("::aphia::")[0] ?? "";
  const sampleAphiaId = sampleEntry?.includes("::aphia::") ? sampleEntry.split("::aphia::")[1] : "";
  const sampleCandidate = sampleCandidateKey ? candidateByEntry.get(sampleCandidateKey) : undefined;
  const invalidSampleGroup = invalidSampleKey
    ? [...data.invalid.tables.non_taxonomic_category, ...data.invalid.tables.taxonomic_mismatch]
        .find((group) => group.sample_key === invalidSampleKey)
    : undefined;

  function navigate(nextRoute: Route) {
    const path = nextRoute === "valid" ? "/valid" : nextRoute === "invalid" ? "/invalid" : "/mapping";
    window.history.pushState(null, "", path);
    setRoute(nextRoute);
    setSelected(null);
    setSelectedInvalid(null);
    setSampleEntry(null);
    setInvalidSampleKey(null);
  }

  function toggleDataset(dataset: DatasetId) {
    setDatasets((current) => {
      const next = new Set(current);
      if (next.has(dataset)) next.delete(dataset);
      else next.add(dataset);
      return next;
    });
  }

  function toggleRisk(risk: string) {
    setRisks((current) => {
      const next = new Set(current);
      if (next.has(risk)) next.delete(risk);
      else next.add(risk);
      return next;
    });
  }

  function updateQuery(index: number, value: string) {
    setQueries((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  }

  const riskCounts = data.candidates.reduce<Record<string, number>>((acc, candidate) => {
    (candidate.risk_flags ?? "").split("|").filter(Boolean).forEach((risk) => {
      acc[risk] = (acc[risk] ?? 0) + 1;
    });
    (candidate.special_tags ?? "").split("|").filter(Boolean).forEach((tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1;
    });
    return acc;
  }, {});
  const tagAndRiskLabels = { ...SPECIAL_TAG_LABELS, ...RISK_LABELS };

  return (
    <div className="app-shell">
      <div className={sampleCandidate || invalidSampleGroup ? "taxonomy-view hidden-view" : "taxonomy-view"}>
        <header className="topbar">
          <div>
            <p className="eyebrow">Phase 3 FlowCAM integration</p>
            <h1>Taxonomy Integration Review</h1>
          </div>
          <nav className="topnav" aria-label="Review sections">
            <button className={route === "valid" ? "active" : ""} onClick={() => navigate("valid")}>
              Valid tree
            </button>
            <button className={route === "invalid" ? "active" : ""} onClick={() => navigate("invalid")}>
              Invalid labels
            </button>
            <button className={route === "mapping" ? "active" : ""} onClick={() => navigate("mapping")}>
              Mapping status
            </button>
          </nav>
          <button className="help-button" onClick={() => setHelpOpen(true)} aria-label="Open terminology help">
            <HelpCircle size={18} />
            Terms
          </button>
          <div className="summary-grid">
            {route === "valid" ? (
              <>
                <Stat label="Entries" value={formatNumber(data.tree.dataset_class_entry_count)} />
                <Stat label="AphiaIDs" value={formatNumber(data.tree.unique_selected_aphia_id_count)} />
                <Stat label="Placements" value={formatNumber(data.tree.entry_count)} />
                <Stat label="Images" value={formatNumber(data.tree.unique_candidate_image_count)} />
              </>
            ) : route === "invalid" ? (
              <>
                <Stat label="Non-taxonomic" value={formatNumber(data.invalid.summary.table_counts.non_taxonomic_category)} />
                <Stat label="Mismatch" value={formatNumber(data.invalid.summary.table_counts.taxonomic_mismatch)} />
                <Stat
                  label="Total invalid"
                  value={formatNumber(
                    data.invalid.summary.table_counts.non_taxonomic_category +
                      data.invalid.summary.table_counts.taxonomic_mismatch
                  )}
                />
                <Stat label="Invalid images" value={formatNumber(data.invalid.summary.total_image_count)} />
              </>
            ) : (
              <>
                <Stat label="Classes" value={formatNumber(data.mapping.target_count)} />
                <Stat label="Histories" value={formatNumber(data.mapping.histories.length)} />
                <Stat
                  label="Latest merge"
                  value={formatNumber(
                    data.mapping.histories.find((history) => history.history_id === data.mapping.latest_history_id)?.merge_count ?? 0
                  )}
                />
                <Stat
                  label="Latest drop"
                  value={formatNumber(
                    data.mapping.histories.find((history) => history.history_id === data.mapping.latest_history_id)?.drop_count ?? 0
                  )}
                />
              </>
            )}
          </div>
        </header>

        <div className="workspace">
          {route === "valid" ? (
            <>
            <aside className="filters">
            <div className="multi-search" aria-label="Search filters">
              {queries.map((value, index) => (
                <div className="searchbox" key={index}>
                  <Search size={16} />
                  <input
                    value={value}
                    onChange={(event) => updateQuery(index, event.target.value)}
                    aria-label={`Search term ${index + 1}`}
                  />
                </div>
              ))}
            </div>

            <section>
              <h2><SlidersHorizontal size={16} /> Datasets</h2>
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
              <h2>Tag / risk filters</h2>
              {Object.keys(tagAndRiskLabels).map((risk) => (
                <label className="check-row" key={risk}>
                  <input
                    type="checkbox"
                    checked={risks.has(risk)}
                    onChange={() => toggleRisk(risk)}
                  />
                  {tagAndRiskLabels[risk]} ({riskCounts[risk] ?? 0})
                </label>
              ))}
            </section>

            <section>
              <h2>Terminal rank</h2>
              <select value={rank} onChange={(event) => setRank(event.target.value)}>
                <option value="">All ranks</option>
                {ranks.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </section>

            </aside>

            <main className="tree-panel">
            <div className="panel-header">
            <div>
              <p className="eyebrow">Tree</p>
              <h2>WoRMS lineage structure</h2>
            </div>
            <p className="muted">
              Initial branches open to Phylum; labels without Phylum expand to terminal.
            </p>
          </div>
          <div className="tree-toolbar">
            <span className="muted">Tree text</span>
            <button onClick={() => setTreeScale((value) => Math.max(1.04, value - 0.08))}>A-</button>
            <button onClick={() => setTreeScale(1.19)}>Reset</button>
            <button onClick={() => setTreeScale((value) => Math.min(1.62, value + 0.08))}>A+</button>
            <button onClick={() => setExpandAllVersion((value) => value + 1)}>Expand all</button>
            <button
              onClick={() => {
                setTreeResetKey((value) => value + 1);
              }}
            >
              Default open
            </button>
          </div>
          <div className="tree-scale" style={{ fontSize: `${treeScale}rem` }}>
            {visibleTree ? (
              <TaxonomyTree
                key={treeResetKey}
                node={visibleTree}
                onSelect={setSelected}
                expandAllVersion={expandAllVersion}
              />
            ) : (
              <div className="empty-state">
                <p className="eyebrow">No matches</p>
                <h2>Tree cleared by current filters</h2>
                <p>
                  Try a different search term, enable more datasets, or clear the risk/rank filters.
                </p>
              </div>
            )}
            </div>
          <RiskPanels
            candidates={data.candidates}
            onSelect={(entryId) => {
              const candidate = candidateByEntry.get(entryId);
              if (candidate) {
                setSelected({
                  type: "dataset_class",
                  name: candidate.label,
                  entry_id: candidate.entry_id,
                  dataset_id: candidate.dataset_id,
                  dataset_label: DATASET_LABELS[candidate.dataset_id],
                  original_label: candidate.original_label,
                  image_count: Number(candidate.image_count),
                  candidate_image_count: Number(candidate.image_count),
                  valid_image_count: Number(candidate.valid_image_count || candidate.image_count),
                  invalid_image_count: Number(candidate.invalid_image_count || 0),
                  entry_count: 1,
                  selected_aphia_id: candidate.selected_aphia_ids,
                  selected_aphia_source: candidate.selected_aphia_source,
                  synonym_note: candidate.synonym_note,
                  status_review_flag: candidate.status_review_flag,
                  status_review_rollup_aphia_id: candidate.status_review_rollup_aphia_id,
                  status_review_rollup_name: candidate.status_review_rollup_name,
                  status_review_rollup_rank: candidate.status_review_rollup_rank,
                  status_review_evidence_json: candidate.status_review_evidence_json,
                  broad_class: candidate.broad_class,
                  broad_class_original_label: candidate.broad_class_original_label,
                  broad_class_aphia_id: candidate.broad_class_aphia_id,
                  broad_class_source_file: candidate.broad_class_source_file,
                  contaminated_sources: candidate.contaminated_sources,
                  lineage_notes: candidate.lineage_notes.split("|").filter(Boolean),
                  risk_flags: candidate.risk_flags.split("|").filter(Boolean),
                  special_tags: candidate.special_tags.split("|").filter(Boolean),
                  children: []
                });
              }
            }}
          />
            </main>

            <DetailDrawer
              node={selected}
              candidate={selectedCandidate}
              samples={selectedSamples}
              sampleMap={data.samples}
              invalidSampleMap={data.invalid.samples}
              invalidGroups={selectedInvalidGroups}
              onClose={() => setSelected(null)}
              onOpenSamples={setSampleEntry}
              onOpenInvalidSamples={setInvalidSampleKey}
            />
            </>
          ) : route === "invalid" ? (
            <>
              <InvalidLabelsReview
                data={data.invalid}
                selected={selectedInvalid}
                onSelect={setSelectedInvalid}
              />
              <InvalidDetailDrawer
                group={selectedInvalid}
                samples={selectedInvalid ? data.invalid.samples[selectedInvalid.sample_key] ?? [] : []}
                onClose={() => setSelectedInvalid(null)}
                onOpenSamples={setInvalidSampleKey}
              />
            </>
          ) : (
            <MappingStatusReview data={data.mapping} />
          )}
      </div>
      </div>
      {sampleEntry && sampleCandidate && (
        <SamplePage
          candidate={sampleCandidate}
          title={sampleAphiaId ? `${sampleCandidate.label} · AphiaID ${sampleAphiaId}` : undefined}
          samples={data.samples[sampleEntry] ?? []}
          onBack={() => setSampleEntry(null)}
        />
      )}
      {invalidSampleKey && invalidSampleGroup && (
        <SamplePage
          title={invalidSampleGroup.aliases.join(" / ")}
          subtitle={`${invalidSampleGroup.status} · ${invalidSampleGroup.total_image_count.toLocaleString()} images · showing up to ${data.invalid.summary.sample_limit_per_dataset} thumbnails per dataset`}
          backLabel="Back to invalid labels"
          samples={data.invalid.samples[invalidSampleKey] ?? []}
          onBack={() => setInvalidSampleKey(null)}
        />
      )}
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatNumber(value: number | undefined) {
  return typeof value === "number" ? value.toLocaleString() : "0";
}

export default App;
