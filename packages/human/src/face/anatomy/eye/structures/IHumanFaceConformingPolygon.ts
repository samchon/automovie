import type { HumanFaceConformingMaterialArithmetic as Arithmetic } from "../HumanFaceConformingMaterialArithmetic";
import type { IHumanFaceConformingMaterialCut } from "./IHumanFaceConformingMaterialCut";

/**
 * Exact twice-area as a signed rational, used before any output rounding.
 */
type MaterialArea = ReturnType<typeof Arithmetic.addArea>;

/**
 * One ordered convex intersection and its exact material area. Ear incidence
 * is evaluated after the sheet owner remaps the shared cuts.
 *
 * @author Samchon
 */
export interface IHumanFaceConformingPolygon {
  /** Original incidence cuts in the retained convex boundary order. */
  cuts: IHumanFaceConformingMaterialCut[];

  /** Exact signed twice-area, before binary64 output conversion. */
  area: MaterialArea;
}
