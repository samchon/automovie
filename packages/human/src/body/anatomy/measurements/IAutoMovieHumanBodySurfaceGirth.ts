import type { AutoMovieHumanBodySurfaceDimension } from "./AutoMovieHumanBodySurfaceDimension";

/**
 * A skin circumference observed by tape or validated surface scan. Calipers measure a straight breadth and are excluded from observed girths.
 *
 * @evidence contracts/common.md#principled-implementation The girth specialization permits circumference observations from tape or surface scan with shared metric provenance.
 * @evidence contracts/common.md#clear-and-simple-design One exterior circumference alias narrows acquisition methods without duplicating the generic scalar union.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Caliper breadth is excluded from observed girths rather than converted into an invented circumference.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes skin circumference from straight breadth and delegates units/posture to the scalar contract.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Girth typing executes no contour extraction, perimeter integration or breadth conversion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The circumference alias coordinates no cached contour solve across body records.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Girth metadata acquires no contour buffers, scanner session or retained integration state.
 * @author Samchon
 */
export type IAutoMovieHumanBodySurfaceGirth =
  AutoMovieHumanBodySurfaceDimension<"tape" | "surface-scan">;
