import { useEffect, useMemo, useState } from "react";
import { HelpCircle, Search, SlidersHorizontal } from "lucide-react";
import { DetailDrawer } from "./components/DetailDrawer";
import { HelpModal } from "./components/HelpModal";
import { InvalidDetailDrawer } from "./components/InvalidDetailDrawer";
import { InvalidLabelsReview } from "./components/InvalidLabelsReview";
import { RiskPanels } from "./components/RiskPanels";
import { SamplePage } from "./components/SamplePage";
import { TaxonomyTree } from "./components/TaxonomyTree";
import { DATASET_LABELS, DATASETS, RISK_LABELS } from "./data/constants";
import type { Candidate, DatasetId, InvalidLabelData, InvalidLabelGroup, SampleMap, TreeNode } from "./types";
import { parseCsv } from "./utils/csv";
import { collectRanks, filterTree, normalizeTree, type Filters } from "./utils/tree";

type DataState = {
  tree: TreeNode;
  candidates: Candidate[];
  samples: SampleMap;
  invalid: InvalidLabelData;
};

type Route = "valid" | "invalid";

function currentRoute(): Route {
  return window.location.pathname.startsWith("/invalid") ? "invalid" : "valid";
}

function App() {
  const [data, setData] = useState<DataState | null>(null);
  const [route, setRoute] = useState<Route>(currentRoute());
  const [query, setQuery] = useState("");
  const [datasets, setDatasets] = useState<Set<DatasetId>>(new Set(DATASETS));
  const [risks, setRisks] = useState<Set<string>>(new Set());
  const [rank, setRank] = useState("");
  const [treeScale, setTreeScale] = useState(1.08);
  const [expandAllVersion, setExpandAllVersion] = useState(0);
  const [treeResetKey, setTreeResetKey] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [selectedInvalid, setSelectedInvalid] = useState<InvalidLabelGroup | null>(null);
  const [sampleEntry, setSampleEntry] = useState<string | null>(null);
  const [invalidSampleKey, setInvalidSampleKey] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [treeRes, candidatesRes, samplesRes, invalidRes] = await Promise.all([
        fetch("/data/taxonomy_tree.json"),
        fetch("/data/valid_class_candidates.csv"),
        fetch("/data/class_image_samples.json"),
        fetch("/data/invalid_label_groups.json")
      ]);
      const tree = (await treeRes.json()) as TreeNode;
      setData({
        tree: normalizeTree(tree),
        candidates: parseCsv<Candidate>(await candidatesRes.text()),
        samples: await samplesRes.json(),
        invalid: await invalidRes.json()
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
  }, [query, datasets, risks, rank]);

  const candidateByEntry = useMemo(() => {
    const map = new Map<string, Candidate>();
    data?.candidates.forEach((candidate) => map.set(candidate.entry_id, candidate));
    return map;
  }, [data]);

  const ranks = useMemo(() => (data ? collectRanks(data.tree) : []), [data]);

  const filters: Filters = useMemo(
    () => ({ query, datasets, risks, rank }),
    [query, datasets, risks, rank]
  );

  const visibleTree = useMemo(() => {
    if (!data) return null;
    return filterTree(data.tree, filters)[0] ?? null;
  }, [data, filters]);

  const selectedCandidate =
    selected?.entry_id ? candidateByEntry.get(selected.entry_id) : undefined;
  const selectedSamples = selected?.entry_id && data ? data.samples[selected.entry_id] ?? [] : [];

  if (!data) {
    return <div className="loading">Loading taxonomy data...</div>;
  }

  const sampleCandidate = sampleEntry ? candidateByEntry.get(sampleEntry) : undefined;
  const invalidSampleGroup = invalidSampleKey
    ? [...data.invalid.tables.non_taxonomic_category, ...data.invalid.tables.taxonomic_mismatch]
        .find((group) => group.sample_key === invalidSampleKey)
    : undefined;

  function navigate(nextRoute: Route) {
    const path = nextRoute === "valid" ? "/valid" : "/invalid";
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

  const riskCounts = data.candidates.reduce<Record<string, number>>((acc, candidate) => {
    candidate.risk_flags.split("|").filter(Boolean).forEach((risk) => {
      acc[risk] = (acc[risk] ?? 0) + 1;
    });
    return acc;
  }, {});

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
            ) : (
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
            )}
          </div>
        </header>

        <div className="workspace">
          {route === "valid" ? (
            <>
            <aside className="filters">
            <div className="searchbox">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search label, taxon, AphiaID"
              />
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
              <h2>Risk filters</h2>
              {Object.keys(RISK_LABELS).map((risk) => (
                <label className="check-row" key={risk}>
                  <input
                    type="checkbox"
                    checked={risks.has(risk)}
                    onChange={() => toggleRisk(risk)}
                  />
                  {RISK_LABELS[risk]} ({riskCounts[risk] ?? 0})
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
            <button onClick={() => setTreeScale((value) => Math.max(0.95, value - 0.08))}>A-</button>
            <button onClick={() => setTreeScale(1.08)}>Reset</button>
            <button onClick={() => setTreeScale((value) => Math.min(1.4, value + 0.08))}>A+</button>
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
                  broad_class: candidate.broad_class,
                  broad_class_original_label: candidate.broad_class_original_label,
                  broad_class_aphia_id: candidate.broad_class_aphia_id,
                  broad_class_source_file: candidate.broad_class_source_file,
                  contaminated_sources: candidate.contaminated_sources,
                  lineage_notes: candidate.lineage_notes.split("|").filter(Boolean),
                  risk_flags: candidate.risk_flags.split("|").filter(Boolean),
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
              onClose={() => setSelected(null)}
              onOpenSamples={setSampleEntry}
            />
            </>
          ) : (
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
          )}
      </div>
      </div>
      {sampleEntry && sampleCandidate && (
        <SamplePage
          candidate={sampleCandidate}
          samples={data.samples[sampleEntry] ?? []}
          onBack={() => setSampleEntry(null)}
        />
      )}
      {invalidSampleKey && invalidSampleGroup && (
        <SamplePage
          title={invalidSampleGroup.aliases.join(" / ")}
          subtitle={`${invalidSampleGroup.status} · ${invalidSampleGroup.total_image_count.toLocaleString()} images · showing up to 5 thumbnails per dataset`}
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
