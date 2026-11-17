import type { IAutoMovieMotionHumanLimbFitFrame } from "@automovie/interface";

/** Native observers lend only their private numeric state to a history. */
const OBSERVERS: WeakMap<AirborneShapeStatistics.IObserver, AirborneShapeStatistics.IStatistics> = new WeakMap();

/**
 * Observe one physical-planning operation without inserting hot-path callbacks.
 *
 * The caller explicitly supplies this handle to one or more histories and
 * reads independent snapshots outside its timed/physical work. Counts are
 * cumulative across those histories and their clears. A snapshot callback
 * replacement is never invoked by physics, so it cannot hide its failure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines eight cumulative populations: history queries/memo hits, numeric nodes, SPD/Jacobi calls, and analytic rate attempts/accepted instants/stencil selections. Each rated node attempts rates on first construction, including stencil neighbors; only a requested instant can consume the stored derivative or select its unavailable fallback. Memo hits do neither; callback/reducer throws remain attempts without acceptance or fallback. Generic nodes count per cache epoch and a fixed shape counts its actual construction. Snapshots are independent and foreign handles are refused.
 * @evidence contracts/development/implementation.md#principled-implementation Counts actual owner events instead of inferring populations from elapsed time, misses or patched methods. A native private numeric record separates observation from physical computation; its dimensionless integer totals are exactly represented within JavaScript's safe range and do not certify physical success.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One factory allocates eight scalars and a snapshot reader, weak registration lends native storage once per history, and each actual owner increments its event counters. Attempts count actual node-construction callbacks; accepted counts a requested instant using its complete cached reduction, and fallback counts an uncached query selecting its stored unavailable stencil. Neighbor-only nodes can remain attempts without either query event. No notification callback participates in physics or clear.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No ambient observer, replaced global, physical-bound change, fixture label or event log is introduced. Physics never calls the supplied read method or a foreign getter, and copying that method or supplying a prepared flag cannot forge weak-map provenance. Refusal and failed attempts are never reclassified as success.
 * @evidence contracts/development/implementation.md#efficient-algorithms Factory, borrow and snapshot have constant work/storage. A history with no observer allocates no counter record, array or per-query event value. Native observation adds guarded numeric increments only at actual events, and borrow allocates nothing in either branch.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One explicit handle accumulates actual events across its supplied histories and cache clears; snapshots do not reset totals or change cache state. Snapshot mutation cannot change native counters, and measured populations never establish physical eligibility or cached-answer equivalence.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A caller-owned handle retains eight scalars and its reader, with weak registration retaining no handle. Histories borrow numeric state without the observer/read callback, and clear detaches statistics from issued instants. No body, pose, timestamp history or retained snapshot population is stored.
 */
export function AirborneShapeStatistics(): AirborneShapeStatistics.IObserver {
  const statistics: AirborneShapeStatistics.IStatistics = {
    queries: 0, memoHits: 0, uniqueNumericNodes: 0, factorizations: 0, publicJacobi: 0,
    analyticAttempts: 0, analyticAccepted: 0, analyticFallbacks: 0,
  };
  const observer: AirborneShapeStatistics.IObserver = {
    read: (): AirborneShapeStatistics.IStatistics => ({ ...statistics }),
  };
  OBSERVERS.set(observer, statistics);
  return observer;
}

/**
 * Native physical-work populations and the handle that observes them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Members define every event, attempt/completion distinction, clear semantics and independent-snapshot ownership.
 * @evidence contracts/development/design.md#principled-representation Counts are dimensionless populations of actual owner events, independent of wall time or the physical result; a native handle has no writable counter fields.
 * @evidence contracts/development/design.md#minimal-and-owned-surface History owns query/node and actual analytic-attempt/accepted/fallback populations, inertia owns factor/Jacobi work, and the performance reporter consumes read snapshots only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fixture labels, timers, arbitrary event payloads or public prepared-value flags enter this fixed-size eight-counter representation.
 */
export namespace AirborneShapeStatistics {
  /**
   * Actual event totals over all histories supplied the same observer.
   *
   */
  export interface IStatistics {
    /** Calls to the history reader, including memo hits and calls that throw. */
    queries: number;

    /** Query calls that return an already stored exact-time instant. */
    memoHits: number;

    /** Successful numeric mass-node constructions: first-demand insertions per cache epoch or the fixed constructor's one compiled snapshot. Rated nodes include their tensor and derivative/unavailable packet; a shape/pose/tensor/rate/reducer throw before insertion adds none. Clear/reentry adds actual new work. */
    uniqueNumericNodes: number;

    /** Actual calls to the SPD factor owner, including a null admission result. */
    factorizations: number;

    /** Actual calls to public principal Jacobi materialization, including throws; old instants materialized after clear are outside their finished history epoch. */
    publicJacobi: number;

    /** Actual instantaneous-rate callback calls at first numeric-node construction, including stencil neighbors and excluding cached nodes/memo hits; callback/reducer throws remain attempted work. */
    analyticAttempts: number;

    /** Requested instants whose complete cached derivative reduction supplied the returned relative momentum. An unrequested stencil neighbor's computed derivative adds none until that instant is queried. */
    analyticAccepted: number;

    /** Uncached queries whose stored undefined/incomplete declaration selected the original stencil. The stencil may throw and a retry selects it again without a new derivative attempt. */
    analyticFallbacks: number;
  }

  /**
   * A native operation's counter handle with an independently owned snapshot.
   *
   */
  export interface IObserver {
    /** Return fresh cumulative scalar totals; called only by the explicit reporter. */
    read(): IAutoMovieMotionHumanLimbFitFrame.IStatistics;
  }

  /**
   * Borrow native counter storage once when a history is constructed.
   *
   */
  export function borrow(observer?: IObserver): IAutoMovieMotionHumanLimbFitFrame.IStatistics | undefined {
    if (observer === undefined) return undefined;
    const statistics: IAutoMovieMotionHumanLimbFitFrame.IStatistics | undefined = OBSERVERS.get(observer);
    if (statistics === undefined) throw new Error("Airborne statistics needs a native observer handle");
    return statistics;
  }
}
