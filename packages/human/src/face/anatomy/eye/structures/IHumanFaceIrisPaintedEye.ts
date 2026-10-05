import type { IHumanFaceIrisDisc } from "./IHumanFaceIrisDisc";
import type { IHumanFaceIrisTexels } from "./IHumanFaceIrisTexels";

/**
 * One eye prepared for painting on a decoded globe texture: its located iris
 * disc, the texels on that disc and the mean sclera colour just outside it.
 *
 * @evidence contracts/common.md#principled-implementation The disc, its texels and the surrounding sclera mean are computed once from the neutral globe and reused for every pigment.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the prepared texture's anonymous eye element.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The sclera colour is averaged from the texture itself, never a constant chosen per asset.
 * @evidence contracts/common.md#meaningful-documentation States each field's producer and the colour space of the sclera mean.
 * @evidence contracts/modeling.md#spatial-conventions Disc lengths are basis metres and angles radians; the sclera mean is linear RGB in [0, 1].
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record names an eye owner and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The painted texture is observed under the pigment rule that consumes it.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The disc's anatomy belongs to the locator; this record only carries it.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived data, not a caller input.
 * @author Samchon
 */
export interface IHumanFaceIrisPaintedEye {
  /** Eye owner painted on the texture. */
  eye: string;

  /** Located iris disc of the eye's neutral globe. */
  disc: IHumanFaceIrisDisc;

  /** Texels of the texture that lie on that disc. */
  texels: IHumanFaceIrisTexels;

  /** Mean linear sclera colour just outside the painted iris. */
  sclera: [number, number, number];
}
