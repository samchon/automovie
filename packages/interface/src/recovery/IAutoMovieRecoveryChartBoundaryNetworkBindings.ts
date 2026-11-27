import type { IAutoMovieRecoveryChartBoundaryNetwork } from "./IAutoMovieRecoveryChartBoundaryNetwork";
import type { IAutoMovieRecoveryChartBoundaryNetworkRegistry } from "./IAutoMovieRecoveryChartBoundaryNetworkRegistry";

/** Bind maximal physical arcs to all copied chart sides after augmentation. */

export namespace IAutoMovieRecoveryChartBoundaryNetworkBindings {
  /** Bind maximal physical arcs to all copied chart sides after augmentation. */

  export type Operation = (
    input: Parameters<IAutoMovieRecoveryChartBoundaryNetwork.Operation>[0],
    context: ReturnType<IAutoMovieRecoveryChartBoundaryNetworkRegistry.Operation>,
  ) => ReturnType<IAutoMovieRecoveryChartBoundaryNetwork.Operation>;
}
