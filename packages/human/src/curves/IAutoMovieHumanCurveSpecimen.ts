import type { IAutoMovieCurve64 } from "@automovie/engine";

import type { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import type { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";

/** The same admitted person's already resolved measurements and 55-bone rest.
 * Regional resolvers read this object; they do not regenerate mechanical joints.
 * Frames are parent-relative millimetres from those actual joints.
 * @author Samchon
 */
export interface IAutoMovieHumanCurveSpecimen {
  /** Existing admitted detailed measurements, not source calibration records. */
  measurements: IAutoMovieHumanMeasurements;

  /** Existing generated neutral rest joints in millimetres. */
  skeleton: IAutoMovieHumanSkeleton;

  /** Parent-relative proper transforms resolved before construction. */
  frames: readonly IAutoMovieCurve64.Frame[];
}
