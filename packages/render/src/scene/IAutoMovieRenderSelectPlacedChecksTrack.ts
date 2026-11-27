import type { IAutoMoviePlacedContinuity } from "@automovie/interface";
import type { IAutoMovieRenderSelectPlacedChecksRule } from "./IAutoMovieRenderSelectPlacedChecksRule";

/** One entity track on its shot clocks. */
export interface IAutoMovieRenderSelectPlacedChecksTrack extends IAutoMovieRenderSelectPlacedChecksRule {
  /**
   * The entity's authored world transform at a shot-local second: a present
   * or missing required record, null when the shot does not involve the
   * entity, or undefined when it cannot be determined.
  */
  readonly observe: (
    shot: string,
    seconds: number,
  ) =>
    | Exclude<
        Extract<
          IAutoMoviePlacedContinuity.IProps,
          { kind: "transform" }
        >["observation"],
        undefined
      >
    | null
    | undefined;
  /**
   * Maximum speed in metres per shot-local second. Omit to leave displacement
   * unbounded.
  */
  readonly maxSpeed?: number;
  /**
   * Maximum angular speed in radians per shot-local second. Omit to leave
   * rotation unbounded.
  */
  readonly maxAngularSpeed?: number;
  /** Allowance added to each limit, in metres and radians. */
  readonly tolerance?: { readonly distance: number; readonly angle: number };
}
