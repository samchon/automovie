import type { HumanFaceConformingMaterialArithmetic as Arithmetic } from "../HumanFaceConformingMaterialArithmetic";
import type { IHumanFaceConformingMaterialCut } from "./IHumanFaceConformingMaterialCut";

/**
 * Exact twice-area as a signed rational, used before any output rounding.
 *
 * @evidence contracts/common.md#principled-implementation A rational numerator and denominator preserve addition and exact coverage comparison.
 * @evidence contracts/common.md#clear-and-simple-design Two integers carry only the signed area required by coverage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No floating tolerance replaces equality of the covered and original area.
 * @evidence contracts/common.md#meaningful-documentation States the signed twice-area convention used by the coverage owner.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The MaterialArea witness does not define an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The MaterialArea witness adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The MaterialArea witness does not choose a mesh population.
 * @evidence contracts/modeling.md#spatial-conventions Area is expressed in squared common material units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The MaterialArea witness does not construct a part join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this MaterialArea witness carries no independent rendered form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The MaterialArea witness supplies no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The MaterialArea witness defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The MaterialArea witness exposes no personal shaping input.
 */
type MaterialArea = ReturnType<typeof Arithmetic.addArea>;

/**
 * One ordered convex intersection and its exact material area. Ear incidence
 * is evaluated after the sheet owner remaps the shared cuts.
 *
 * @evidence contracts/common.md#principled-implementation Original cut order and exact area describe the same convex overlap without resampling.
 * @evidence contracts/common.md#clear-and-simple-design A cut array and area carry the polygon; its owner emits ears at the existing later consumer stage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original boundary provenance is retained rather than recovered from rounded coordinates.
 * @evidence contracts/common.md#meaningful-documentation States why ear incidence is evaluated later and names the shared-cut remapping owner.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries a construction polygon, not an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The polygon owner determines ear population.
 * @evidence contracts/modeling.md#spatial-conventions Area and cuts share the common dimensionless material frame.
 * @evidence contracts/modeling.md#shared-boundaries Cut order retains every original edge subdivision shared by adjacent overlap pieces.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue owner observes the final offset shell.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no measured anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no physiological interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal shaping input.
 *
 * @author Samchon
 */
export interface IHumanFaceConformingPolygon {
  /** Original incidence cuts in the retained convex boundary order. */
  cuts: IHumanFaceConformingMaterialCut[];

  /** Exact signed twice-area, before binary64 output conversion. */
  area: MaterialArea;
}
