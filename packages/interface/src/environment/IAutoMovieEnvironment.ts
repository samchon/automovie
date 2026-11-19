import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieStage } from "../authoring/IAutoMovieStage";
import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieEngineShotRuntime } from "../production/IAutoMovieEngineShotRuntime";
import type { IAutoMovieWorldDesign } from "../production/IAutoMovieWorldDesign";

/**
 * A prepared place's scene placements, compile runtime records and named frames.
 *
 * @evidence contracts/development/design.md#principled-representation Every scene placement and anchor carries world metres. Stage support retains each named patch and its walkability in one stage space. Clip clocks stay shot-local.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Stage and runtime records spread into the corresponding existing shot inputs. Architecture records retain topology for queries and prop placement. Named frames remain available for authored placement, paths and targets.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This result is portable data. Actor, camera, timing, provider and rendering-host choices remain with the shot's existing owners.
 * @evidence contracts/development/common.md#meaningful-documentation States the destination of each output, the world frame, relative anchor keys and support omission.
 */
export interface IAutoMovieEnvironment {
  /** The stage set and optional merged support space for the shot program. */
  stage: Required<Pick<IAutoMovieStage, "set">> &
    Pick<IAutoMovieStage, "space">;

  /** Runtime-side values for `compileDefinedShot`, including the prepared world. */
  runtime: Required<
    Pick<IAutoMovieEngineShotRuntime, "models" | "props" | "objectMotions">
  > & {
    /** Production world carrying queryable terrain, routes and compact populations. */
    world: IAutoMovieWorldDesign;
  };

  /** Named rigid world frames, including item origins, keyed relative to this environment. */
  anchors: Readonly<Record<string, IAutoMovieTransform>>;

  /** Resolved built environments available for architectural queries and prop admission. */
  builtEnvironments: readonly IAutoMovieBuiltEnvironment[];
}
