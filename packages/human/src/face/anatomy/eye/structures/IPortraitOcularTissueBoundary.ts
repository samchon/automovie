import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The eye supplies its final refined lid curves and resident ocular support. X increases on both sides; anatomical left has its medial corner at minimum X. Upper and lower curves share endpoints and return millimetre head coordinates.
 *
 * @evidence contracts/common.md#principled-implementation Both anatomical sides use increasing head X and shared lid endpoints, so the tissue builder changes medial distance without reversing mesh winding.
 * @evidence contracts/common.md#clear-and-simple-design The boundary supplies final lid and globe readers instead of storing duplicated ocular geometry alongside the eye's resident surfaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Side is a supported anatomical distinction; the boundary introduces no guessed registration, fixture coordinates or overridden foreign reader.
 * @evidence contracts/common.md#meaningful-documentation The interface states head millimetres, ordered canthal X bounds, shared endpoints and the raised-cornea allowance of the globe callback.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This callback bundle selects no sampling resolution; createPortraitOcularTissues owns the fixed corner and lower-margin lattice traversals.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Boundary readers share the eye's current refined frame by construction; the interface itself introduces no result identity or cache invalidation rule.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The eye owns the supplied surface readers; this structural view opens no GPU object, file or background task.
 *
 * @author Samchon
 */
export interface IPortraitOcularTissueBoundary {
  /** Anatomical side determining which canthus is medial. */
  side: "left" | "right";

  /** Smaller canthal X in head millimetres. */
  minimumX: number;

  /** Larger canthal X in head millimetres, strictly above minimumX. */
  maximumX: number;

  /**
   * Final upper-lid point at head X, in millimetres.
   *
   * @evidence contracts/common.md#principled-implementation The upper reader returns the eye's final refined lid at the supplied head X, preserving the same aperture endpoints as the lower reader.
   * @evidence contracts/common.md#clear-and-simple-design A surface callback leaves upper-lid evaluation with the eye instead of copying its refined curve into the tissue builder.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback requires the resident upper surface, with no fallback lid location or independent tissue registration.
   * @evidence contracts/common.md#meaningful-documentation The member comment identifies the upper boundary query and its head-millimetre coordinate contract.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callable signature chooses no curve-evaluation algorithm; the supplying eye owns the upper sampler's per-query work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No upper-lid memo is declared by the callback type; current geometry identity remains with the supplying eye.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The upper reader is a borrowed eye callback, not a separately acquired renderer or running task.
   */
  upper: (x: number) => IAutoMovieVector3;

  /**
   * Final lower-lid point at head X, in millimetres.
   *
   * @evidence contracts/common.md#principled-implementation The lower reader supplies the refined lower aperture boundary in the same increasing-X frame, allowing local opening width to be measured against upper.
   * @evidence contracts/common.md#clear-and-simple-design Keeping lower-lid sampling at the eye's boundary prevents the wet-margin builder from inventing a second lower rim.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No guessed lower-eye profile is prescribed; nonfinite or inverted returned samples are refused by the tissue producer.
   * @evidence contracts/common.md#meaningful-documentation The documentation names the lower-lid point operation and fixes its input and result to head millimetres.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Lower-boundary sampling strategy is not implemented by this function type; the eye's supplied reader owns its complexity.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no completed lower queries and makes no promise that separate posed boundaries are equivalent.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ownership stays with the eye providing the lower callback; this member opens no handle that a tissue consumer must close.
   */
  lower: (x: number) => IAutoMovieVector3;

  /**
   * Support height in mm. The eye may include its raised cornea as well as sclera.
   *
   * @evidence contracts/common.md#principled-implementation The globe reader returns current ocular support depth at head X/Y, including raised cornea where the eye's support surface requires it.
   * @evidence contracts/common.md#clear-and-simple-design One resident support callback gives both conjunctival patches their depth without adding an independently fitted sphere.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Raised cornea is an explicit supported ocular difference; nonfinite support heights are rejected rather than replaced by guessed depths.
   * @evidence contracts/common.md#meaningful-documentation The comment states millimetre support height and clarifies that the surface may include cornea as well as sclera.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This depth-reader contract selects no intersection or interpolation routine; its concrete ocular supplier determines evaluation cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The globe signature owns no cross-patch cache, even though both tissue patches borrow the same current support reader.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A borrowed ocular height callback has no independent disposal operation or background activity.
   */
  globe: (x: number, y: number) => number;
}
