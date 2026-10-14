/**
 * Source authority for display and each independently cached numerical domain.
 *
 * @evidence contracts/common.md#principled-implementation Separate browser, face, body and person digests express actual dependency authority; person includes composition while browser also includes loaded inputs.
 * @evidence contracts/common.md#clear-and-simple-design Four named domains expose the cache and display invalidation boundaries used by catalogue keys and source watching.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Domain separation follows runtime imports rather than selecting subject fixtures or ignoring inconvenient source changes.
 * @evidence contracts/common.md#meaningful-documentation Member comments explain which source dependencies each digest includes and the browser's input authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This digest record chooses no hash or graph algorithm; createHumanViewerRevisions computes the domain values.
 * @evidence contracts/performance.md#reuse-equivalent-work The surrounding revision owner recomputes affected graphs after file edits; consumers reuse numerical results only under unchanged domain and basis/document keys.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Four digest strings retain no source graph or worker handle; the revision owner manages those independently.
 *
 * @author Samchon
 */
export interface IHumanViewerRevisions {
  /** Source and input authority loaded by the browser and its worker. */
  browser: string;

  /** Full transitive graph rooted at the face entry, including shared barrel initialization and dependencies. */
  face: string;

  /** Full transitive graph rooted at the body entry; overlap with other entry graphs is permitted. */
  body: string;

  /**
   * Whole-person runtime, including its face, body and composition dependencies.
   */
  person: string;
}
