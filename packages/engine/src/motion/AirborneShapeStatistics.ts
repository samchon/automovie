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
 * @evidence contracts/development/common.md#meaningful-documentation Defines five cumulative event totals: attempted history queries, returned exact memo hits, successful first numeric-node insertions per cache epoch, actual SPD-owner calls including null, and public Jacobi calls including throws before clear. Read returns independent snapshots without reset; borrow accepts undefined or a native handle and rejects a foreign handle before shape work.
 * @evidence contracts/development/implementation.md#principled-implementation Counts actual owner events instead of inferring populations from elapsed time, misses or patched methods. A native private numeric record separates observation from physical computation; its dimensionless integer totals are exactly represented within JavaScript's safe range and do not certify physical success.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One factory allocates five scalars and a snapshot reader, a weak registration lends native storage once per history, and the actual history/inertia owners increment their own event counters. Reports explicitly read fresh copies outside the physical call; no notification callback participates in integration or clear.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No ambient observer, replaced global, physical-bound change, fixture label or event log is introduced. Physics never calls the supplied read method or a foreign getter, and copying that method or supplying a prepared flag cannot forge weak-map provenance. Refusal and failed attempts are never reclassified as success.
 * @evidence contracts/development/implementation.md#efficient-algorithms Factory, borrow and snapshot have constant work/storage. A history with no observer allocates no counter record, array or per-query event value. Native observation adds guarded numeric increments only at actual events, and borrow allocates nothing in either branch.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One explicit handle accumulates actual events across its supplied histories and cache clears; snapshots do not reset totals or change cache state. Snapshot mutation cannot change native counters, and measured populations never establish physical eligibility or cached-answer equivalence.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A caller-owned handle retains five scalars and its reader, with weak registration retaining no handle. Histories borrow numeric state without the observer/read callback, and clear detaches statistics from issued instants. No body, pose, timestamp history or retained snapshot population is stored.
 */
export function AirborneShapeStatistics(): AirborneShapeStatistics.IObserver {
  const statistics: AirborneShapeStatistics.IStatistics = {
    queries: 0, memoHits: 0, uniqueNumericNodes: 0, factorizations: 0, publicJacobi: 0,
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The history counts queries/nodes, the inertia owner counts factor/Jacobi work, and the performance reporter consumes only read snapshots.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fixture labels, timers, arbitrary event payloads or public prepared-value flags enter this five-counter representation.
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

    /** Successful first-demand mass-node insertions per cache epoch; clear/reentry adds new work to this cumulative total. A shape/pose call that throws before insertion adds none. */
    uniqueNumericNodes: number;

    /** Actual calls to the SPD factor owner, including a null admission result. */
    factorizations: number;

    /** Actual calls to public principal Jacobi materialization, including throws; old instants materialized after clear are outside their finished history epoch. */
    publicJacobi: number;
  }

  /**
   * A native operation's counter handle with an independently owned snapshot.
   *
   */
  export interface IObserver {
    /** Return fresh cumulative scalar totals; called only by the explicit reporter. */
    read(): IStatistics;
  }

  /**
   * Borrow native counter storage once when a history is constructed.
   *
   */
  export function borrow(observer?: IObserver): IStatistics | undefined {
    if (observer === undefined) return undefined;
    const statistics: IStatistics | undefined = OBSERVERS.get(observer);
    if (statistics === undefined) throw new Error("Airborne statistics needs a native observer handle");
    return statistics;
  }
}
