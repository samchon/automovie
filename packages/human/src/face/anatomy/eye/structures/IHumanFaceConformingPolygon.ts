import type { HumanFaceConformingMaterialArithmetic as Arithmetic } from "../HumanFaceConformingMaterialArithmetic";
import type { IHumanFaceConformingMaterialCut } from "./IHumanFaceConformingMaterialCut";

/**
 * Exact twice-area as a signed rational, used before any output rounding.
 */
type MaterialArea = ReturnType<typeof Arithmetic.addArea>;

/**
 * One admitted simple material outline or convex grid/host intersection and
 * its exact signed twice-area. The polygon owner triangulates original cut
 * ordinals before sheet assembly remaps shared emitted vertices.
 *
 *
 * @evidence contracts/common.md#principled-implementation Ordered original cuts accompany exact signed twice-area before output rounding.
 * @evidence contracts/common.md#clear-and-simple-design HumanFaceConformingPolygon owns outline/intersection order, area and original-cut triangulation; the sheet owns shared remapping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Area and cut identity remain separate; this record does not certify whole-source coverage.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies retained boundary order, original-cut triangulation and exact area representation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceConformingPolygon is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceConformingPolygon declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceConformingPolygon itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
 */
export interface IHumanFaceConformingPolygon {
  /** Original incidence cuts in the retained boundary order. */
  cuts: IHumanFaceConformingMaterialCut[];

  /** Exact signed twice-area, before binary64 output conversion. */
  area: MaterialArea;
}
