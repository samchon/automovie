import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";

/**
 * Exact barycentric correspondence on one native host triangle.
 * Chart lifting retains rational weights until the host reads a head-frame
 * point once. The same triangle supplies its existing corner-normal field.
 * This internal correspondence is not a personal authoring input.
 *
 * @author Samchon
 */
export interface IHumanFaceExactSkinSeat {
  /** Ordinal in the host's actual complete triangle winding. */
  triangle: number;

  /** Exact affine weights of those three corners, summing to one. */
  weights: readonly [
    IHumanExactFraction,
    IHumanExactFraction,
    IHumanExactFraction,
  ];
}
