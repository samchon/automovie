import type { IFaceLipMarginAnchor } from "./IFaceLipMarginAnchor";

/** Original-vertex station pairs beside their per-shape commissure limit.
 * The existing instrument owns sampling and connectivity; this record changes
 * no source vertices, station convention or acceptance guard.
 * @author Samchon
 */
export interface IFindLipMarginPairsResult {
  /** Upper and lower source-vertex anchors at each accepted station. */
  pairs: IFaceLipMarginAnchor[];

  /** Source-frame station limit toward the commissures, metres. */
  limitMetres: number;
}
