import type { IAutoMovieAngleRange } from "@automovie/interface";

/**
 * Existing TT shoulder reach: angular intervals and the periodic plane/elevation envelope, admitted by the shoulder owner.
 *
 * @evidence contracts/common.md#principled-implementation Elevation and axial intervals combine with periodic plane-versus-elevation knots to bound shoulder goals.
 * @evidence contracts/common.md#clear-and-simple-design The plane envelope remains separate from the two scalar intervals it supplements.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source admission owns knot ordering and reach, without interpreting the table as individual clinical capacity.
 * @evidence contracts/common.md#meaningful-documentation Members state degrees, total humerothoracic elevation and periodic knot meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shoulder reach schema has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shoulder reach schema schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The shoulder reach schema declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyShoulderRange {
  /** Total humerothoracic elevation interval, degrees. */
  elevation: IAutoMovieAngleRange;

  /** Humerothoracic axial-rotation interval, degrees. */
  axialRotation: IAutoMovieAngleRange;

  /** Existing periodic [plane, maximum elevation] knots, degrees; source admission owns ordering and reach. */
  envelope: [number, number][];
}
