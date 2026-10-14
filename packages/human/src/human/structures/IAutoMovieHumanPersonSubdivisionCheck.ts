import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanPersonBoundaryStitchProps } from "./IAutoMovieHumanPersonBoundaryStitchProps";

/**
 * Inputs of `assertHumanPersonSubdivision`: the stitch being performed, the positions emitted so far, the region's triangles, and one emitted piece of one original triangle.
 *
 * @evidence contracts/common.md#principled-implementation Original and emitted triangle corners share the emitted coordinate population, while the pre-subdivision area vector supplies the orientation reference for admission.
 * @evidence contracts/common.md#clear-and-simple-design One check record carries both admission operands and the perimeter lineage required to explain a folded boundary piece.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Diagnostic context records the actual failed triangle and stitch, without replacing its geometry or relaxing the orientation test.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish original triangle ordinals, emitted corners, the area vector and the perimeter after inserted boundary points.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The check record selects no triangle scan; subdivision admission owns the constant area test and failure-only neighbor diagnostics.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each record describes one emitted piece, with no cache key or cross-piece sharing policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Subdivision operands are borrowed during synchronous admission; the interface starts no task and retains no failure log itself.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSubdivisionCheck {
  /** The stitch being performed. */
  stitch: IAutoMovieHumanPersonBoundaryStitchProps;

  /** The positions emitted so far, the piece's corners among them. */
  emitted: readonly number[];

  /** The region's triangles, as the stitch reads them. */
  indices: readonly number[];

  /** The original triangle's area vector before subdivision. */
  before: IAutoMovieVector3;

  /** The original triangle's corners. */
  original: number[];

  /** The emitted piece's corners. */
  corners: number[];

  /** The original triangle's ordinal. */
  triangle: number;

  /** The original triangle's perimeter after boundary points were inserted. */
  perimeter: number[];
}
