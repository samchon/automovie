import { environmentSupportReport } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieEnvironment,
  IAutoMovieEnvironmentSupportReport,
  IAutoMovieSetPieceSupport,
} from "@automovie/interface";

import { deepFreeze } from "./deepFreeze";

/**
 * Recompute a composed environment's support report from its own staged,
 * runtime, space and building records after freezing them in place, so a report
 * that writes into any record it reads throws.
 *
 * Each building is swept at ground height 0, the height of a building placed at
 * `y = 0`. The furnishing wall mounts are not among the environment's outputs,
 * so a hung piece is judged here as if it had no wall.
 *
 * @param environment The composed environment; its records stay frozen.
 * @returns The recomputed findings, one per staged piece in stage order.
 */
export function frozenSupportReport(
  environment: IAutoMovieEnvironment,
): IAutoMovieSetPieceSupport[] {
  return environmentSupportReport(
    deepFreeze({
      set: environment.stage.set,
      models: environment.runtime.models,
      props: environment.runtime.props,
      ...(environment.stage.space !== undefined
        ? { space: environment.stage.space }
        : {}),
      buildings: environment.builtEnvironments.map(
        (
          built: IAutoMovieBuiltEnvironment,
        ): IAutoMovieEnvironmentSupportReport.IBuilding => ({
          environment: built,
          groundY: 0,
        }),
      ),
    }),
  );
}
