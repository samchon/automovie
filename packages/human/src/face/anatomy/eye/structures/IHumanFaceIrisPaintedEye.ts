import type { IHumanFaceIrisDisc } from "./IHumanFaceIrisDisc";
import type { IHumanFaceIrisTexels } from "./IHumanFaceIrisTexels";

/**
 * One eye prepared for painting on a decoded globe texture: its located iris
 * disc, the texels on that disc and the mean sclera colour just outside it.
 *
 *
 * @evidence contracts/common.md#principled-implementation One prepared eye joins its neutral disc, actual selected texel coordinates and surrounding linear sclera colour.
 * @evidence contracts/common.md#clear-and-simple-design prepareHumanFaceIrisTextures owns compilation while the pigment rule owns per-document painting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The surrounding colour is a display sample rather than acquired reflectance.
 * @evidence contracts/common.md#meaningful-documentation Fields identify eye owner, neutral disc, selected texels and mean linear colour.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceIrisPaintedEye is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceIrisPaintedEye declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceIrisPaintedEye itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
 */
export interface IHumanFaceIrisPaintedEye {
  /** Eye owner painted on the texture. */
  eye: string;

  /** Located iris disc of the eye's neutral globe. */
  disc: IHumanFaceIrisDisc;

  /** Texels of the texture that lie on that disc. */
  texels: IHumanFaceIrisTexels;

  /** Mean surrounding linear sclera colour, or the preparation owner's white fallback when its ring is empty. */
  sclera: [number, number, number];
}
