import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";

/**
 * Affine nearest point on a native face, edge or vertex, expressed relative
 * to one guide's first point and divided by that guide's numerical scale.
 * Exact rational projections retain the native binary64 coordinates through
 * edge dot products and face Gram equations. The closed membership domain
 * rounds its exact endpoints once to the course's binary64 parameter format.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinProjectionFeature {
  /** Actual native feature corners; coordinate-identical seam aliases are equivalent. */
  vertices: readonly number[];

  /** Projected position at guide parameter zero, in scaled local coordinates. */
  origin: readonly IHumanExactFraction[];

  /** Change per unit guide parameter, in scaled local coordinates. */
  velocity: readonly IHumanExactFraction[];

  /** First valid guide parameter. */
  lower: number;

  /** Last valid guide parameter. */
  upper: number;
}
