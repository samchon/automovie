import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * A declared planted-foot window for foot-skate validation.
 *
 * The window is explicit because stance phase is action semantics, not a fact
 * the generic motion validator can safely infer from geometry alone.
 *
 * @author Samchon
 */
export interface IAutoMovieFootContactWindow {
  /** Foot bone that should stay planted through the window. */
  bone: AutoMovieHumanoidBone;

  /** Inclusive start time in seconds. */
  start: number;

  /** Inclusive end time in seconds. */
  end: number;

  /** Allowed horizontal speed in meters/second for this contact window. */
  maxHorizontalSpeed?: number;
}
