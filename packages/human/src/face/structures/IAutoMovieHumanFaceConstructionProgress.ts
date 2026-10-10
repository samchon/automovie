/**
 * Actual completed construction boundary for one face document.
 *
 * Geometry completion does not establish admission. Admission completion
 * reports its actual verdict, including a refused draft. A thrown geometry
 * stage reports only the internal owners that actually finished. No timer, estimated fraction or model buffer
 * is carried, and constructor bootstrap is identified by its own document ID.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceConstructionProgress {
  /** The exact input document whose completed stage is being reported. */
  documentId: string;

  /** Matching connected basis, preserving generation ownership. */
  basis: string;

  /** Completion boundary reached by actual construction execution. */
  phase: "geometry-owner-finished" | "geometry-built" | "admission-check-finished" | "admission-finished";

  /** Actual internal geometry owner that completed; not a geometry or admission verdict. */
  geometryOwner?: string;

  /** Original condition owner, supplied only for its completed admission check. */
  checkOwner?: string;

  /** Actual check or final verdict; absent at geometry completion. */
  accepted?: boolean;
}
