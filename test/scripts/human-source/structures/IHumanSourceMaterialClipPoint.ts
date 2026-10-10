import type { IHumanExactFraction } from "@automovie/human/common/measure/IHumanExactFraction";

/** Exact represented-input material coordinates used by the native clip owner.
 * Coordinates are dimensionless in the registered native disk; weights refer
 * to one original triangle. Physical positions are evaluated by the consumer.
 * @author Samchon
 */
export interface IHumanSourceMaterialClipPoint {
  /** Exact two-coordinate material point from the original triangle support. */
  coordinates: IHumanExactFraction[];

  /** Exact original-triangle barycentric support before final number rounding. */
  weights: IHumanExactFraction[];
}
