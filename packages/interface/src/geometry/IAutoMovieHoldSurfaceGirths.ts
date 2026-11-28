import type { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import type { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";

/** Cage and rest-fit inputs for enforcing subdivision-limit ring perimeter. */
export namespace IAutoMovieHoldSurfaceGirths {
  /**
   * Rest cage topology, shared sweep rigs and rest reevaluation needed to hold
   * declared limit ring perimeters.
   *
   * Five-point Gauss?Legendre quadrature integrates periodic subdivision-limit
   * spans. The coupled Broyden solve targets relative error at most 1e-9, with
   * a 24-fit limit and explicit refusal of invalid measurements or stalled
   * factors. Regular limit-ring incidence defines where this perimeter model
   * applies.
   */
  export type IProps = {
    /**
     * Read-only rest network whose rings with declared perimeter select the
     * solve targets. Each selected ring belongs to one sweep and one station.
     */
    network: IAutoMovieSurfaceNetwork;
    /**
     * Ring names mapped to ordered closed-loop cage vertex ordinals. Each
     * vertex addresses three scalars in the position buffer.
     */
    rings: Record<string, number[]>;
    /**
     * Borrowed cage face vertex lists used to identify the regular row
     * neighbourhood for limit measurements.
     */
    faces: ReadonlyArray<readonly number[]>;
    /**
     * Cage vertex count governing the index range and the three-scalar position
     * layout.
     */
    vertices: number;
    /**
     * Return the same sealed rig for each existing network sweep name on
     * successive calls. The solver installs its correction on that rig.
     */
    sweepRig: (name: string) => IAutoMovieSweepRig;
    /**
     * Reevaluate and fit the network at rest with current girth factors,
     * filling the supplied packed metre control positions.
     */
    rest: (positions: Float64Array) => void;
    /**
     * Caller-owned writable rest XYZ buffer with three metre scalars per
     * vertex. A failed solve can leave the last evaluated trial in this buffer
     * and the rigs.
     */
    positions: Float64Array;
  };
}
