import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Eyebrows.
 *
 * @author Samchon
 */
export interface IAutoMovieHeadBrow {
  /** Vertical brow position: `+` higher (feminine arch), `-` lower. */
  height?: AutoMovieFaceWeight;

  /** Brow tilt: `+` arched up, `-` angled down. */
  angle?: AutoMovieFaceWeight;
}
