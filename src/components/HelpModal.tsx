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
                LifeWatch <code>Tripos</code> and LifeWatch 2026 <code>Tripos</code>
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
          <h3>Special tags</h3>
          <dl className="help-list">
            <div>
              <dt>DwC Record</dt>
              <dd>
                Tara Pacific DwC-A <code>scientificNameID</code> exact-matches the
                label, but the referenced WoRMS record is not accepted or does
                not have <code>isExtinct=0</code>. This is a review tag, not a
                risk flag.
              </dd>
            </div>
            <div>
              <dt>Multiple</dt>
              <dd>
                The original label contains <code>multiple</code> or
                <code>colony</code>, suggesting a multi-object or colonial class.
              </dd>
            </div>
            <div>
              <dt>Juvenile</dt>
              <dd>
                The original label contains <code>veliger</code>,
                <code>larvae</code>, or <code>nauplii</code>, suggesting
                juvenile or life-stage material.
              </dd>
            </div>
          </dl>
        </div>

        <div className="help-section">
          <h3>Risk flags</h3>
          <dl className="help-list">
            <div>
              <dt>Contaminated</dt>
              <dd>
                The baseline WoRMS validation layer has both accepted validation rows
                and invalid validation rows for the same dataset label. Cleanup-based
                broad-class placements do not create this flag by themselves.
              </dd>
            </div>
            <div>
              <dt>Subordinate AphiaID</dt>
              <dd>
                該類別的資料存在一個資料的 aphia id，其對應的名稱是該資料名稱的從屬，在歸類上以 Aphia ID 為準。
              </dd>
            </div>
            <div>
              <dt>Broad class</dt>
              <dd>
                Invalid broad mappings or Round 12 upward loose matches are placed
                at a verified broader WoRMS taxon while preserving the original
                label and reason in the detail drawer.
              </dd>
            </div>
            <div>
              <dt>Corrected</dt>
              <dd>
                The original WoRMS record is unaccepted, but WoRMS resolves it to
                an accepted valid AphiaID. The accepted target is used for tree
                placement, while the original ID/name remains visible as review
                evidence.
              </dd>
            </div>
            <div>
              <dt>Challenged</dt>
              <dd>
                The original WoRMS record or its valid target is still non-accepted
                or ambiguous. The tree uses the nearest accepted common ancestor
                when needed, and keeps the full candidate evidence in the drawer.
              </dd>
            </div>
          </dl>
        </div>

        <div className="help-section">
          <h3>Invalid label review</h3>
          <dl className="help-list">
            <div>
              <dt>Invalid label</dt>
              <dd>
                A dataset label that remains outside the valid taxonomy tree after
                round 0 and round 1 cleanup. These rows are kept for expert review,
                not automatic integration.
              </dd>
            </div>
            <div>
              <dt>Non-Taxonomic Category</dt>
              <dd>
                A label that is non-biological, grouped, temporary, too coarse for
                strict matching, or lacks an exact usable WoRMS match under the
                current rules.
              </dd>
            </div>
            <div>
              <dt>Taxonomic Mismatch</dt>
              <dd>
                A local numeric AphiaID resolves to a WoRMS taxon that does not
                match the dataset label. The original reason text is preserved in
                the invalid detail drawer.
              </dd>
            </div>
            <div>
              <dt>Valid-tree overlap</dt>
              <dd>
                An invalid-review row whose dataset label is already represented in
                the valid tree, usually as a contaminated candidate. Invalid review
                hides these rows by default.
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
              <strong>Subphylum / subclass / superorder</strong>: WoRMS may insert
              extra hierarchy between familiar ranks. These levels are shown as
              normal taxonomy structure, not risk.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
