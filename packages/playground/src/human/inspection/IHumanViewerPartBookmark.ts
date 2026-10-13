/**
 * One named part of the displayed human, with the meshes that draw it and the document that shows it.
 *
 * `meshes` are exact names the viewport reports through `/parts`, which the anatomical `label` stands for. The gallery page opens each bookmark isolated, and marks one whose mesh the document no longer reports, so a renamed mesh shows up at once instead of as a silent blank frame.
 *
 * A bookmark is authored navigation into a published document, not proof that the named part is personal anatomy or clinically registered. Missing mesh names remain a visible catalogue mismatch instead of a substituted mesh identity.
 *
 * @evidence contracts/common.md#principled-implementation A document address and exact reported mesh-name set bind authored anatomical navigation to actual product observation without fuzzy name remapping.
 * @evidence contracts/common.md#clear-and-simple-design Stable bookmark identity and heading/label remain application metadata while the viewport owns mesh inventory and isolation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing reported meshes remain named mismatches, and anatomical labels alone do not establish personal or clinical registration validity.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies exact names, grouped isolation, renamed-mesh reporting and the navigation-only anatomical qualification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This bookmark record chooses no mesh lookup, catalogue grouping or display algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Bookmark labels alone carry no numerical cache authority or repeated-frame equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record retains ordinary strings and names without acquiring meshes or renderer resources; gallery ownership determines data lifetime.
 *
 * @author Samchon
 */
export interface IHumanViewerPartBookmark {
  /** Stable identity of the bookmark. */
  id: string;

  /** Heading the bookmark is listed under. */
  region: string;

  /** Anatomical name. */
  label: string;

  /** Published document that carries these meshes. */
  doc: string;

  /** Exact mesh names, isolated together. */
  meshes: string[];
}
