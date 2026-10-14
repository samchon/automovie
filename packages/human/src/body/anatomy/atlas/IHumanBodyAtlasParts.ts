import type { IAutoMovieModel } from "@automovie/interface";

/**
 * Separate static atlas parts and diagnostic materials appended by the body builder before resident-model admission.
 *
 * @evidence contracts/common.md#principled-implementation Explicit inspection emits separate posed atlas parts and diagnostic materials before resident-model admission.
 * @evidence contracts/common.md#clear-and-simple-design Geometry and per-part appearance stay separate while preserving anatomical/export correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Diagnostic finishes certify neither personal tissue nor biological coloration.
 * @evidence contracts/common.md#meaningful-documentation Members document static anatomical identities and finishes preserving export correspondence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Atlas result arrays run no rigid-positioning or GPU-rendering algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Completed parts/materials define no equivalence key for later inspection requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Model records belong to their build; this interface acquires no rendering resources.
 * @author Samchon
 */
export interface IHumanBodyAtlasParts {
  /** Posed static parts with independent anatomical identities. */
  parts: IAutoMovieModel["parts"];

  /** A separate diagnostic finish per part preserves export correspondence. */
  materials: IAutoMovieModel["materials"];
}
