import type { IAutoMovieAngleRange } from "@automovie/interface";

/**
 * Existing TT shoulder reach: angular intervals and the periodic plane/elevation envelope, admitted by the shoulder owner.
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
