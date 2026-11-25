import type { IAutoMovieSurfaceConstruction } from "./IAutoMovieSurfaceConstruction";
import type { IAutoMovieSurfaceCurveRig } from "./IAutoMovieSurfaceCurveRig";
import type { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import type { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";

/**
 * Registration inputs for a one-use snapshot of the network's actual
 * construction curves.
 */
export namespace IAutoMoviePrepareSurfaceConstruction {
  /**
   * Register observation writers while a network rig is still open, then read
   * them after its girth solve and final rest evaluation.
   *
   * Sweep observations use the same zero-cell writer as unsampled sweep nodes;
   * spine observations read the same registered section frame; network curves
   * use the actual tangent-constrained curve rig as patch boundaries, including
   * its resolved geometric endpoint cells. Those curves are not raw zero-cell
   * sweep observations. Feature observations read the compiled field's own
   * smooth domain course. No observation enters the cage registry, changes a
   * sampling cell or adds a vertex.
   */
  export type IProps = {
    /**
     * Borrowed rest declarations selecting sweep spines, stations, guides,
     * features and network curves to observe. Used during registration;
     * returned observations are separate mutable snapshots.
     */
    network: IAutoMovieSurfaceNetwork;

    /**
     * Resolve each sweep to its shared unsealed rig so this call can register
     * frame and zero-cell sample slots. The one-use reader retains resulting
     * writers until a successful read; callback errors propagate.
     */
    sweepRig: (name: string) => IAutoMovieSweepRig;

    /**
     * Resolve or compile the named network curve using the same endpoint nodes
     * and geometric cells as patch boundaries. Returned rigs are retained until
     * the observation reader runs, after registry finalization and rest
     * evaluation.
     */
    curveRig: (
      name: string,
      curve: IAutoMovieSurfaceNetwork.ICurve,
    ) => IAutoMovieSurfaceCurveRig;
    /**
     * Counts for all four observation kinds. Omission returns an always-empty
     * reader without registrations. The preparer rejects missing/unknown keys
     * and unsafe counts: station needs at least three, the others at least
     * one.
     */
    samples?: IAutoMovieSurfaceConstruction.ISamples;
  };
}
