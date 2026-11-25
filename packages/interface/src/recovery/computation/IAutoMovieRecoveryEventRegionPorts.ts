import type { IAutoMovieRecoveryEventRegion } from "./IAutoMovieRecoveryEventRegion";
import type { IAutoMovieRecoveryEventRegionCells } from "./IAutoMovieRecoveryEventRegionCells";
import type { IAutoMovieRecoveryEventRegionSource } from "./IAutoMovieRecoveryEventRegionSource";
import type { IAutoMovieRecoveryEventRegionTopology } from "./IAutoMovieRecoveryEventRegionTopology";

/**
 * Attach contact and port ownership evidence after component topology is
 * complete.
 */

export namespace IAutoMovieRecoveryEventRegionPorts {
  /**
   * Attach contact and port ownership evidence after component topology is
   * complete.
   */

  export type Operation = (
    source: Parameters<IAutoMovieRecoveryEventRegion.Operation>[0],
    prepared: ReturnType<IAutoMovieRecoveryEventRegionSource.Operation>,
    work: ReturnType<IAutoMovieRecoveryEventRegionCells.Operation>,
    topology: ReturnType<IAutoMovieRecoveryEventRegionTopology.Operation>,
    query: Parameters<ReturnType<IAutoMovieRecoveryEventRegion.Operation>>[0],
  ) => ReturnType<ReturnType<IAutoMovieRecoveryEventRegion.Operation>>;
}
