import { IAutoMovieClip, IAutoMovieLight } from "@automovie/interface";

/**
 * What {@link resolveShotLighting} evaluates: the staged lights and the clips
 * changing them.
 *
 * @author Samchon
 */
export interface IAutoMovieShotLightingInput {
  /** The scene's staged lights, in staging order. */
  lights: readonly IAutoMovieLight[];

  /** The shot's light-motion clips (`IAutoMovieShot.lightMotions`). */
  clips: readonly IAutoMovieClip[];

  /** The instant to evaluate, in shot-local seconds. */
  seconds: number;
}
