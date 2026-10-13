/**
 * The last source edit that reached a build, as `/health` reports it.
 *
 * The latest published source batch identifies changed files, observation time and moved domains. It is source-freshness context rather than a global causal event journal.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the edited files, the time and the build domains it moved.
 *
 * @evidence contracts/common.md#principled-implementation Edited paths, publication time and moved revision domains identify the source event a serving update follows.
 * @evidence contracts/common.md#clear-and-simple-design The record carries one edit batch rather than separate unrelated revision and timestamp histories.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Moved domains are the digest owner's observed changes rather than guesses from filename prefixes.
 *
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Edited paths, publication time and moved revision domains identify the source event a serving update follows.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Moved domains are the digest owner's observed changes rather than guesses from filename prefixes.
 *
 * @author Samchon
 */
export interface IHumanViewerEdit {
  /**
   * Edited files, relative to the repository root.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Names the actual repository-relative files changed in the published source batch.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Names the actual repository-relative files changed in the published source batch.
   */
  files: string[];

  /**
   * ISO time the edit was published.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Locates source publication in wall time without assigning numerical identity from that timestamp.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Locates source publication in wall time without assigning numerical identity from that timestamp.
   */
  at: string;

  /**
   * Revision domains the edit moved (`browser`, `face`, `body`, `person`).
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Reports the revision domains whose actual digest comparison changed after the edit batch.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Reports the revision domains whose actual digest comparison changed after the edit batch.
   */
  moved: string[];
}
