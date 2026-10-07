import type { IHumanSourceNativeSupport } from "./IHumanSourceNativeSupport.ts";

/** Native support stencil for one appended source point, before compaction.
 * The producer records identity, original support and the authored rest offset.
 * Rig and endpoint consumers use the support coefficients; the offset describes
 * the produced rest geometry. Historical prose annotations remain raw provenance
 * and are not a required binding algorithm or a numerical input.
 * @author Samchon
 */
export interface IHumanSourceAuthoredBinding {
  id: number;
  nativeParents: IHumanSourceNativeSupport[];
  offsetBlenderMetres: number[];
}
