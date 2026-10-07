import type { IHumanExactFraction } from "@automovie/human/common/measure/IHumanExactFraction";

/** Exact represented-input material coordinates used by the native clip owner.
 * Coordinates are in source head metres; weights refer to one original triangle.
 * @author Samchon
 */
export interface IHumanSourceMaterialClipPoint {
  /** Exact source-space XYZ from the original triangle support. */
  xyz: IHumanExactFraction[];

  /** Exact original-triangle barycentric support before final number rounding. */
  weights: IHumanExactFraction[];
}
