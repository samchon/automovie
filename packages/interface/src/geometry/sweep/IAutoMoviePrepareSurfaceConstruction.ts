import type { IAutoMovieSurfaceConstruction } from "./IAutoMovieSurfaceConstruction";
import type { IAutoMovieSurfaceCurveRig } from "./IAutoMovieSurfaceCurveRig";
import type { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import type { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";

/**
 * Registration inputs for a one-use snapshot of the network's actual construction curves.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Observation counts and named rig resolvers register a one-use snapshot of the actual metre construction field. Absent sample counts allocate no observations; observation registration neither changes registry sampling cells nor substitutes a display spline.
 * @evidence contracts/development/design.md#principled-representation Observation counts and named rig resolvers register a one-use snapshot of the actual metre construction field.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepareAutoMovieSurfaceConstruction shares live sweep and curve rigs with network patch construction, then reads after rest/girth evaluation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent sample counts allocate no observations; observation registration neither changes registry sampling cells nor substitutes a display spline.
 */
export namespace IAutoMoviePrepareSurfaceConstruction {
  /**
   * Register observation writers while a network rig is still open, then read them after its girth solve and final rest evaluation.
   *
   * Sweep observations use the same zero-cell writer as unsampled sweep nodes; spine observations read the same registered section frame; network curves use the actual tangent-constrained curve rig as patch boundaries, including its resolved geometric endpoint cells. Those curves are not raw zero-cell sweep observations. Feature observations read the compiled field's own smooth domain course. No observation enters the cage registry, changes a sampling cell or adds a vertex.
   *
   * @evidence contracts/development/design.md#principled-representation Observation counts select metre polylines from the network's compiled rig; the preparer checks all count keys and minimums before registering points.
   * @evidence contracts/development/design.md#minimal-and-owned-surface rigAutoMovieSurfaceNetwork provides its own sweep and curve resolvers, so observations read the same rest field after girth solving rather than compiling a parallel display model.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Observation slots do not enter the cage registry or change its sampling cells; absent counts request no snapshot.
   * @evidence contracts/development/common.md#meaningful-documentation Gives unsealed registration and finalized read ordering, callback retention and errors, count admission and snapshot ownership.
   */
  export type IProps = {
    /** Borrowed rest declarations selecting sweep spines, stations, guides, features and network curves to observe. Used during registration; returned observations are separate mutable snapshots. */
    network: IAutoMovieSurfaceNetwork;

    /**
     * Resolve each sweep to its shared unsealed rig so this call can register frame and zero-cell sample slots. The one-use reader retains resulting writers until a successful read; callback errors propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States shared unsealed rigs, registration lifetime, one-use reader retention and callback failure propagation.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; prepareAutoMovieSurfaceConstruction and the owning network's live rig resolvers own the numerical method under the documented units and input premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; prepareAutoMovieSurfaceConstruction and the owning network's live rig resolvers own executable decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by prepareAutoMovieSurfaceConstruction and the owning network's live rig resolvers.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; prepareAutoMovieSurfaceConstruction and the owning network's live rig resolvers own its evaluation cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; prepareAutoMovieSurfaceConstruction and the owning network's live rig resolvers decide whether calls share coefficients, identities or mutable state.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; prepareAutoMovieSurfaceConstruction and the owning network's live rig resolvers own references retained by the supplied callable.
     */
    sweepRig: (name: string) => IAutoMovieSweepRig;

    /**
     * Resolve or compile the named network curve using the same endpoint nodes and geometric cells as patch boundaries. Returned rigs are retained until the observation reader runs, after registry finalization and rest evaluation.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States shared endpoint/cell geometry and rig retention through registry finalization and rest evaluation.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; prepareAutoMovieSurfaceConstruction and the owning network's live rig resolvers own the numerical method under the documented units and input premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; prepareAutoMovieSurfaceConstruction and the owning network's live rig resolvers own executable decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by prepareAutoMovieSurfaceConstruction and the owning network's live rig resolvers.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; prepareAutoMovieSurfaceConstruction and the owning network's live rig resolvers own its evaluation cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; prepareAutoMovieSurfaceConstruction and the owning network's live rig resolvers decide whether calls share coefficients, identities or mutable state.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; prepareAutoMovieSurfaceConstruction and the owning network's live rig resolvers own references retained by the supplied callable.
     */
    curveRig: (
      name: string,
      curve: IAutoMovieSurfaceNetwork.ICurve,
    ) => IAutoMovieSurfaceCurveRig;
    /** Counts for all four observation kinds. Omission returns an always-empty reader without registrations. The preparer rejects missing/unknown keys and unsafe counts: station needs at least three, the others at least one. */
    samples?: IAutoMovieSurfaceConstruction.ISamples;
  };
}
