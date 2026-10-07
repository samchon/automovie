/**
 * Actual completed construction boundary for one face document.
 *
 * Geometry completion does not establish admission. Admission completion
 * reports its actual verdict, including a refused draft. A thrown geometry
 * stage reports only the internal owners that actually finished. No timer, estimated fraction or model buffer
 * is carried, and constructor bootstrap is identified by its own document ID.
 *
 * @evidence contracts/common.md#principled-implementation Phase identifies a completed synchronous internal owner or whole-stage boundary; accepted is supplied only after the unchanged admission returns.
 * @evidence contracts/common.md#clear-and-simple-design One record associates a boundary with its exact document and basis.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No elapsed-time guess or admission substitute is represented.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes geometry completion, actual verdict and thrown-stage behavior.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no authoring control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Carries no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Carries no coordinate or unit.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Constructs no spatial join.
 * @evidenceExclude contracts/modeling.md#rendered-observation Carries completion events, not displayed results.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission stays with the construction owner.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no shaping input.
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
