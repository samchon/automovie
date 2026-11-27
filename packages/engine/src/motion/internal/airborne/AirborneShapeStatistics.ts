/**
 * Observe one physical-planning operation without inserting hot-path callbacks.
 *
 * The caller explicitly supplies this handle to one or more histories and reads
 * independent snapshots outside its timed/physical work. Counts are cumulative
 * across those histories and their clears. A snapshot callback replacement is
 * never invoked by physics, so it cannot hide its failure.
 */
export function AirborneShapeStatistics(): AirborneShapeStatistics.IObserver {
  const statistics: AirborneShapeStatistics.IStatistics = {
    queries: 0,
    memoHits: 0,
    uniqueNumericNodes: 0,
    factorizations: 0,
    publicJacobi: 0,
    analyticAttempts: 0,
    analyticAccepted: 0,
    analyticFallbacks: 0,
  };
  return {
    counters: statistics,
    read: (): AirborneShapeStatistics.IStatistics => ({ ...statistics }),
  };
}

/** Native physical-work populations and the handle that observes them. */
export namespace AirborneShapeStatistics {
  /** Actual event totals over all histories supplied the same observer. */
  export interface IStatistics {
    /** Calls to the history reader, including memo hits and calls that throw. */
    queries: number;

    /** Query calls that return an already stored exact-time instant. */
    memoHits: number;

    /**
     * Successful numeric mass-node constructions: first-demand insertions per
     * cache epoch or the fixed constructor's one compiled snapshot. Rated nodes
     * include their tensor and derivative/unavailable packet; a
     * shape/pose/tensor/rate/reducer throw before insertion adds none.
     * Clear/reentry adds actual new work.
     */
    uniqueNumericNodes: number;

    /** Actual calls to the SPD factor owner, including a null admission result. */
    factorizations: number;

    /**
     * Actual calls to public principal Jacobi materialization, including
     * throws; old instants materialized after clear are outside their finished
     * history epoch.
     */
    publicJacobi: number;

    /**
     * Actual instantaneous-rate callback calls at first numeric-node
     * construction, including stencil neighbors and excluding cached nodes/memo
     * hits; callback/reducer throws remain attempted work.
     */
    analyticAttempts: number;

    /**
     * Requested instants whose complete cached derivative reduction supplied
     * the returned relative momentum. An unrequested stencil neighbor's
     * computed derivative adds none until that instant is queried.
     */
    analyticAccepted: number;

    /**
     * Uncached queries whose stored undefined/incomplete declaration selected
     * the original stencil. The stencil may throw and a retry selects it again
     * without a new derivative attempt.
     */
    analyticFallbacks: number;
  }

  /** A native operation's counter handle with an independently owned snapshot. */
  export interface IObserver {
    /** The live counters the histories supplied this observer advance. */
    readonly counters: IStatistics;

    /**
     * Return fresh cumulative scalar totals; called only by the explicit
     * reporter.
     */
    read(): IStatistics;
  }

  /** Borrow native counter storage once when a history is constructed. */
  export function borrow(observer?: IObserver): IStatistics | undefined {
    return observer?.counters;
  }
}
