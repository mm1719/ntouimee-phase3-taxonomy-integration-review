import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function HelpModal({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Terminology help">
      <section className="help-modal">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Terminology</p>
            <h2>Summary statistics, risk definitions, and taxonomy examples</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close help">
            <X size={18} />
          </button>
        </div>

        <div className="help-section">
          <h3>Summary statistics</h3>
          <dl className="help-list">
            <div>
              <dt>Entries</dt>
              <dd>
                Valid dataset-class entries. Dataset identity is preserved, so
                LifeWatch <code>Tripos</code> and FlowCam 2026 <code>Tripos</code>
                count as two entries even if they resolve to the same selected
                AphiaID.
              </dd>
            </div>
            <div>
              <dt>AphiaIDs</dt>
              <dd>
                Unique selected WoRMS AphiaIDs across all valid entries. This is
                the de-duplicated taxonomy count after entries are resolved to
                their selected WoRMS identifiers.
              </dd>
            </div>
            <div>
              <dt>Placements</dt>
              <dd>
                Taxonomy-tree positions drawn from entries. One entry usually
                creates one placement, but an entry with multiple valid selected
                AphiaIDs creates multiple placements, so placements can be higher
                than entries.
              </dd>
            </div>
            <div>
              <dt>Images</dt>
              <dd>
                Unique candidate images covered by valid entries. This is not the
                total source image count and is not multiplied by tree placements.
              </dd>
            </div>
          </dl>
        </div>

        <div className="help-section">
          <h3>Risk flags</h3>
          <dl className="help-list">
            <div>
              <dt>DwC/Aphia mismatch</dt>
              <dd>
                Tara Pacific DwC-A <code>scientificNameID</code> exact-matches the
                label, but its AphiaID differs from the WoRMS validation AphiaID.
                The tree uses the WoRMS AphiaID and preserves the DwC value as
                provenance evidence.
              </dd>
            </div>
            <div>
              <dt>Contaminated</dt>
              <dd>
                The same dataset label has valid evidence and invalid evidence.
                It remains in the tree, but needs manual review before integration.
              </dd>
            </div>
            <div>
              <dt>Multiple AphiaID</dt>
              <dd>
                One dataset label has more than one valid selected AphiaID. It is
                placed in multiple lineage positions rather than merged automatically.
              </dd>
            </div>
          </dl>
        </div>

        <div className="help-section">
          <h3>Taxonomy display examples</h3>
          <p className="muted help-note">
            These examples explain how to read the tree. They are not risk examples unless
            a separate risk badge is shown on that class.
          </p>
          <ul className="help-examples">
            <li>
              <strong>Crustacea</strong>: LifeWatch stops at a high-level
              subphylum, while other datasets may continue to Copepoda,
              Calanoida, or Oncaeidae below it.
            </li>
            <li>
              <strong>Chaetoceros</strong>: FlowCAMNet has the genus-level class,
              while LifeWatch and Tara Pacific may have species-level descendants.
            </li>
            <li>
              <strong>Intermediate rank</strong>: WoRMS may insert levels such as
              Infrakingdom, Subphylum, Infraphylum, or Forma. These are shown as
              normal taxonomy structure, not risk.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
