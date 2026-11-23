import type { IAutoMovieRecoveryChartBoundaryNetwork } from "./IAutoMovieRecoveryChartBoundaryNetwork";
import type { IAutoMovieRecoveryChartBoundaryNetworkRegistry } from "./IAutoMovieRecoveryChartBoundaryNetworkRegistry";

/**
 * Augment copied chart banks with their registered physical cuts in original
 * triangle order.
 */

export namespace IAutoMovieRecoveryChartBoundaryNetworkAugment {
  /**
   * Augment copied chart banks with their registered physical cuts in original
   * triangle order.
   */

  export type Operation = (
    input: Parameters<IAutoMovieRecoveryChartBoundaryNetwork.Operation>[0],
    context: ReturnType<IAutoMovieRecoveryChartBoundaryNetworkRegistry.Operation>,
  ) => number;
}
