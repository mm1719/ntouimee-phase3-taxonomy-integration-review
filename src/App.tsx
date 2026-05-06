import { useEffect, useMemo, useState } from "react";
import { HelpCircle, Search, SlidersHorizontal } from "lucide-react";
import { DetailDrawer } from "./components/DetailDrawer";
import { HelpModal } from "./components/HelpModal";
import { RiskPanels } from "./components/RiskPanels";
import { SamplePage } from "./components/SamplePage";
import { TaxonomyTree } from "./components/TaxonomyTree";
import { DATASET_LABELS, DATASETS, RISK_LABELS } from "./data/constants";
import type { Candidate, DatasetId, SampleMap, TreeNode } from "./types";
import { parseCsv } from "./utils/csv";
import { collectRanks, filterTree, normalizeTree, type Filters } from "./utils/tree";

type DataState = {
  tree: TreeNode;
  candidates: Candidate[];
  samples: SampleMap;
};

function App() {
  const [data, setData] = useState<DataState | null>(null);
  const [query, setQuery] = useState("");
  const [datasets, setDatasets] = useState<Set<DatasetId>>(new Set(DATASETS));
  const [risks, setRisks] = useState<Set<string>>(new Set());
  const [rank, setRank] = useState("");
  const [showIntermediate, setShowIntermediate] = useState(true);
  const [treeScale, setTreeScale] = useState(1.08);
  const [helpOpen, setHelpOpen] = useState(false);
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [sampleEntry, setSampleEntry] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [treeRes, candidatesRes, samplesRes] = await Promise.all([
        fetch("/data/taxonomy_tree.json"),
        fetch("/data/valid_class_candidates.csv"),
        fetch("/data/class_image_samples.json")
      ]);
      const tree = (await treeRes.json()) as TreeNode;
      setData({
        tree: normalizeTree(tree),
        candidates: parseCsv<Candidate>(await candidatesRes.text()),
        samples: await samplesRes.json()
      });
    }
    void load();
  }, []);

  const candidateByEntry = useMemo(() => {
    const map = new Map<string, Candidate>();
    data?.candidates.forEach((candidate) => map.set(candidate.entry_id, candidate));
    return map;
  }, [data]);

  const ranks = useMemo(() => (data ? collectRanks(data.tree) : []), [data]);

  const filters: Filters = useMemo(
    () => ({ query, datasets, risks, rank, showIntermediate }),
    [query, datasets, risks, rank, showIntermediate]
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
      <div className={sampleCandidate ? "taxonomy-view hidden-view" : "taxonomy-view"}>
        <header className="topbar">
          <div>
            <p className="eyebrow">Phase 3 FlowCAM integration</p>
            <h1>Valid Class Taxonomy</h1>
          </div>
          <button className="help-button" onClick={() => setHelpOpen(true)} aria-label="Open terminology help">
            <HelpCircle size={18} />
            Terms
          </button>
          <div className="summary-grid">
            <Stat label="Entries" value={formatNumber(data.tree.dataset_class_entry_count)} />
            <Stat label="AphiaIDs" value={formatNumber(data.tree.unique_selected_aphia_id_count)} />
            <Stat label="Placements" value={formatNumber(data.tree.entry_count)} />
            <Stat label="Images" value={formatNumber(data.tree.unique_candidate_image_count)} />
          </div>
        </header>

        <div className="workspace">
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

            <section>
              <label className="switch-row">
                <input
                  type="checkbox"
                  checked={showIntermediate}
                  onChange={(event) => setShowIntermediate(event.target.checked)}
                />
                Show intermediate ranks
              </label>
              <p className="muted">
                Hidden mode visually skips intermediate ranks and connects their children to the nearest visible parent.
              </p>
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
          </div>
          <div className="tree-scale" style={{ fontSize: `${treeScale}rem` }}>
            {visibleTree ? (
              <TaxonomyTree node={visibleTree} onSelect={setSelected} />
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
                  image_count: Number(candidate.image_count),
                  entry_count: 1,
                  selected_aphia_id: candidate.selected_aphia_ids,
                  selected_aphia_source: candidate.selected_aphia_source,
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
      </div>
      </div>
      {sampleEntry && sampleCandidate && (
        <SamplePage
          candidate={sampleCandidate}
          samples={data.samples[sampleEntry] ?? []}
          onBack={() => setSampleEntry(null)}
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
