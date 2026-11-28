import type { IAutoMovieRecoveryEventRegion } from "./IAutoMovieRecoveryEventRegion";
import type { IAutoMovieRecoveryEventRegionCells } from "./IAutoMovieRecoveryEventRegionCells";
import type { IAutoMovieRecoveryEventRegionSource } from "./IAutoMovieRecoveryEventRegionSource";
import type { IAutoMovieRecoveryEventRegionTopology } from "./IAutoMovieRecoveryEventRegionTopology";

/** Callable finalization of named source port ownership in one clipped query. */

export namespace IAutoMovieRecoveryEventRegionPorts {
  /**
   * Attach each named port to retained source cells, connected components and
   * eligible boundary occurrences. Record contact, ambiguous and missing
   * ownership and any overlapping port claims.
   */

  export type Operation = (
    source: Parameters<IAutoMovieRecoveryEventRegion.Operation>[0],
    prepared: ReturnType<IAutoMovieRecoveryEventRegionSource.Operation>,
    work: ReturnType<IAutoMovieRecoveryEventRegionCells.Operation>,
    topology: ReturnType<IAutoMovieRecoveryEventRegionTopology.Operation>,
    query: Parameters<ReturnType<IAutoMovieRecoveryEventRegion.Operation>>[0],
  ) => ReturnType<ReturnType<IAutoMovieRecoveryEventRegion.Operation>>;
}
