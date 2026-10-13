/**
 * Actual completed construction boundary for one face document.
 *
 * Geometry completion does not establish admission. Admission completion
 * reports its actual verdict, including a refused draft. A thrown geometry
 * stage reports only the internal owners that actually finished. No timer, estimated fraction or model buffer
 * is carried, and constructor bootstrap is identified by its own document ID.
 *
 * @evidence contracts/common.md#principled-implementation Exact document/basis identity and completed owner/stage/check boundaries report actual construction execution; acceptance belongs only to completed admission checks/verdicts.
 * @evidence contracts/common.md#clear-and-simple-design One phase-labelled scalar record carries optional geometry/check owner and verdict without transferring model buffers; the emitting operation owns those phase-specific field relationships.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No estimated fraction substitutes for completed work, geometry completion implies no admission, and a throwing stage supplies no completion event.
 * @evidence contracts/common.md#meaningful-documentation Members state identity, phase and phase-specific optional fields; the comment covers bootstrap, refusal and partial execution.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This event schema computes no progress counters or execution schedule.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each execution boundary is observed distinctly; the event defines no deduplication or geometry cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Fresh scalar events belong to observers and retain no model/worker resource.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceConstructionProgress {
  /** The exact input document whose completed stage is being reported. */
  documentId: string;

  /** Matching connected basis, preserving generation ownership. */
  basis: string;

  /** Completion boundary reached by actual construction execution. */
  phase:
    | "geometry-owner-finished"
    | "geometry-built"
    | "admission-check-finished"
    | "admission-finished";

  /** Actual internal geometry owner that completed; not a geometry or admission verdict. */
  geometryOwner?: string;

  /** Original condition owner, supplied only for its completed admission check. */
  checkOwner?: string;

  /** Actual check or final verdict; absent at geometry completion. */
  accepted?: boolean;
}
