import {
  type AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

/** Regional generation contract over an already resolved neutral rest skeleton.
 *
 * Factories close over physical measurements. The generic assembly supplies
 * their actual parent context and bound upstream operators before construction.
 * Geometry is generated here; a displayed construction net is a later adapter.
 *
 * @author Samchon
 */
export namespace IAutoMovieCurveRegion64 {
  /** One family's generated courses and boundary operators, all in world millimetres.
   *
   * @author Samchon
   */
  export interface Result {
    /** Anatomical display groups; exact coefficients remain authoritative before sampling. */
    groups: readonly {
      part: string;
      side: "left" | "right" | null;
      primitives: readonly C.Primitive[];
    }[];

    /** Owned simple-tube cuts, paired with their generating bone for authenticated publication. */
    boundaries: readonly { bone: string; value: C.Boundary }[];
  }
  /** Generator consuming the same context that authenticates its upstream cuts.
   *
   * @author Samchon
   */
  export interface Factory {
    /** Human owner key in the declared anatomical dependency graph. */
    region: string;

    /** Generate courses after parent resolution; upstream values retain complete dP/d(longitudinal mm) fields. */
    construct(
      context: AutoMovieCurveParentContext,
      upstream: ReadonlyMap<string, C.Boundary>,
    ): Result;
  }
}
