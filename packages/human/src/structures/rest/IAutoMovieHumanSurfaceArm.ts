import { IAutoMovieHumanSurfaceEnvelope } from "./IAutoMovieHumanSurfaceEnvelope";

/** Independent section observations along one arm. */
export interface IAutoMovieHumanSurfaceArm {
  /** Mid upper-arm cut, between the actual shoulder and elbow centres. */
  upperArm?: IAutoMovieHumanSurfaceEnvelope;

  /** Elbow-centre section in the transported limb chart. */
  elbow?: IAutoMovieHumanSurfaceEnvelope;

  /** Forearm support at one quarter of the elbow-to-wrist chord. */
  forearm?: IAutoMovieHumanSurfaceEnvelope;

  /** Wrist cut at the actual hand joint. */
  wrist?: IAutoMovieHumanSurfaceEnvelope;
}
