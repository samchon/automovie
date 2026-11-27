import type { IAutoMovieSweep } from "./IAutoMovieSweep";

/**
 * Rest sweep and resolved bone-buffer indices for compiling reusable sampling
 * slots.
 */
export namespace IAutoMovieRigSweep {
  /**
   * Compile one sweep of a surface rig: its rest surface, and, when it rides
   * bones, the buffers that re-sweep it per pose as `poseSweep` does.
   *
   * At rest every slot reads the compiled rest surface. Posed, each spine point
   * moves with its bone, the starting direction and any end tangents turn with
   * the first or last point's bone, and the spine is re-transported in place;
   * each station's rest plane turns with its bone, or takes the spherical
   * midpoint of its two bones' turns, and the orientation is recomputed; every
   * registered plane is then read from it. With volume preservation and joint
   * stations, the scale profile gains a knot at every station and rest scale
   * knot, the rest scale times a joint factor at joint stations and times 1
   * elsewhere, and `settleSweepVolume` finds the factor whose volume,
   * from the rest section moments and this pose's frames by
   * `integrateSweepVolume`, equals the rest volume. Without either the
   * scale stays the rest profile. A girth factor set by `girth` then multiplies
   * every scale slot, at rest and after settling, so the settled volume is the
   * rest volume before that correction. Shapes before scale come directly from
   * the shared shape evaluator and are read once at registration; no scaled
   * result is divided back into a shape. Parameter-correspondence cells average
   * actual signed section coordinates; radial cells retain radius averaging
   * about their authored direction. Valid Cartesian cancellation at the origin
   * is allowed. Unrepresentable nonzero cell averages, scaled samples and girth
   * products are refused. Girth admission stages every factor, product and
   * probe before committing.
   */
  export type IProps = {
    /**
     * Rest sweep in model metres, validated by compileSweep and
     * retained by the rig. Keep authored geometry stable while compiled slots
     * are in use.
     */
    sweep: IAutoMovieSweep;

    /**
     * Optional compiled bone-buffer indices, distinct from the authored
     * bone-identity binding. Omission keeps all frames at rest. Outer array
     * lengths are checked against the sweep; index validity and one/two station
     * cardinality are caller preconditions.
     */
    binding?: IPropsBinding;

    /**
     * Whether bound two-bone stations settle their radial scale to the authored
     * rest volume before multiplying girth factors. Required explicitly;
     * unbound sweeps or bindings without joints perform no settlement.
     */
    preserveVolume: boolean;
  };

  /** The binding object of {@link IProps}. */
  export type IPropsBinding = {
    /**
     * One nonnegative index in the later pose bone buffer per spine point, in
     * spine order. The array is retained for pose updates.
     */
    points: number[];

    /**
     * One array of one or two bone-buffer indices per station. Two indices
     * mark a joint and blend its rotations at their spherical midpoint. The
     * arrays are retained and must remain stable.
     */
    stations: number[][];
  };
}
