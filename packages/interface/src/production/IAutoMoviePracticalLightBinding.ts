import type { IAutoMovieCompilePracticalLightMotion } from "./IAutoMovieCompilePracticalLightMotion";

/** Bind a staged light to a named emitter on a staged prop for one shot. */
export interface IAutoMoviePracticalLightBinding extends Pick<
  IAutoMovieCompilePracticalLightMotion,
  "id" | "sampleTimes" | "on"
> {
  /** Id of a point or spot light staged in this shot. */
  light: string;

  /** Id of the prop placement in the shot's scene. */
  prop: string;

  /** Fixed emitter affordance id on the prop model registered for the shot. */
  emitter: string;
}
