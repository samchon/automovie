import type { IAutoMoviePhysicalSupportWrench } from "../../physics/IAutoMoviePhysicalSupportWrench";

/**
 * Inputs for drawing the support force a physical controller allocated before native integration.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Wrench instants and the query share the cache's local seconds clock, origins are world metres, forces are newtons and arrow scale is metres per newton. `markAutoMovieSupportWrenches` admits a positive finite interval and scale; moments are not drawn.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieMarkSupportWrenches contracts used by packages/engine/src/composition/markAutoMovieSupportWrenches.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Wrenches are the cache's own requested, allocated and residual records, the query second is on the same clock, and the interval is the cache step that each record governs. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieMarkSupportWrenches contract belongs to interface; packages/engine/src/composition/markAutoMovieSupportWrenches.ts uses its nested records. Runtime computation remains with that consumer.
 */
export namespace IAutoMovieMarkSupportWrenches {
  /**
   * Turn the support wrenches governing one second into inspection marks.
   *
   * A body's wrench governs `seconds` when it is the body's latest record at or before `seconds` and `seconds` lies within one cache `interval` of it, because the controller allocates it before integrating that step. Its allocated force is drawn from the recorded centre of mass; a residual force beyond the allocator's admitted optimisation error is drawn, flagged, from the allocated arrow's tip, so the two arrows sum to the requested force. These are motor-demand diagnostics, not achieved load: contact receipts measure the force a floor actually transferred.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains record selection, the step window, the two arrows and their sum, and what the quantities do not prove.
   * @evidence contracts/development/design.md#principled-representation Seconds, interval, newtons and metres per newton are the cache's own units; the scale and interval are checked by markAutoMovieSupportWrenches.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The mark producer borrows the cache's wrench records and creates unanchored world-space arrows.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The contract reuses the cached wrench records instead of recomputing an allocation or presenting demand as measured contact force.
   */
  export type IProps = {
    /** Borrowed wrench records of a physics cache or playback, ordered by time per body. Empty input returns no marks. */
    wrenches: readonly IAutoMoviePhysicalSupportWrench[];
    /** Drawn local film second on the wrenches' clock. A record governs from its instant (with 1e-9-second tolerance) until, but not including, its instant plus `interval`. */
    seconds: number;
    /** Cache step each record governs, seconds: the reciprocal of the cache rate; markAutoMovieSupportWrenches rejects nonfinite or nonpositive values. */
    interval: number;
    /** Arrow length per newton, metres/newton; markAutoMovieSupportWrenches rejects nonfinite or nonpositive values. */
    metresPerNewton: number;
  };
}
