/**
 * One edit batch sent to the revision worker.
 *
 * @evidence contracts/common.md#principled-implementation An edit batch pairs changed normalized paths with the basis digests published for that batch.
 * @evidence contracts/common.md#clear-and-simple-design The worker receives one change envelope; file access and graph recomputation remain worker responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Changed paths and published basis values are transported without inventing edits or successful revisions.
 * @evidence contracts/common.md#meaningful-documentation Defines edited, created and removed files and the basis authority accompanying their batch.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure An edit batch pairs changed normalized paths with the basis digests published for that batch.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The worker receives one change envelope; file access and graph recomputation remain worker responsibilities.
 * @author Samchon
 */
export interface IHumanViewerRevisionsChange {
  /**
   * Files edited, created or removed, with forward slashes.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Files edited, created or removed, with forward slashes. An edit batch pairs changed normalized paths with the basis digests published for that batch.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Files edited, created or removed, with forward slashes. The worker receives one change envelope; file access and graph recomputation remain worker responsibilities.
   */
  files: string[];

  /**
   * The published basis digests after the batch.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The published basis digests after the batch. An edit batch pairs changed normalized paths with the basis digests published for that batch.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The published basis digests after the batch. The worker receives one change envelope; file access and graph recomputation remain worker responsibilities.
   */
  bases: string;
}
