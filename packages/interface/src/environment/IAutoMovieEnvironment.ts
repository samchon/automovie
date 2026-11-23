import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieStage } from "../authoring/IAutoMovieStage";
import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieEngineShotRuntime } from "../production/IAutoMovieEngineShotRuntime";
import type { IAutoMovieWorldDesign } from "../production/IAutoMovieWorldDesign";

/**
 * A prepared place's scene placements, compile runtime records and named
 * frames.
 */
export interface IAutoMovieEnvironment {
  /** The stage set and optional merged support space for the shot program. */
  stage: Required<Pick<IAutoMovieStage, "set">> &
    Pick<IAutoMovieStage, "space">;

  /** Runtime-side values for `compileDefinedShot`, including the prepared world. */
  runtime: Required<
    Pick<IAutoMovieEngineShotRuntime, "models" | "props" | "objectMotions">
  > & {
    /**
     * Production world carrying queryable terrain, routes and compact
     * populations.
     */
    world: IAutoMovieWorldDesign;
  };

  /**
   * Named rigid world frames, including item origins, keyed relative to this
   * environment.
   */
  anchors: Readonly<Record<string, IAutoMovieTransform>>;

  /**
   * Resolved built environments available for architectural queries and prop
   * admission.
   */
  builtEnvironments: readonly IAutoMovieBuiltEnvironment[];
}
