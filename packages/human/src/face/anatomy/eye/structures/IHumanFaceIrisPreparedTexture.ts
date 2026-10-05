import type { IHumanFaceIrisPaintedEye } from "./IHumanFaceIrisPaintedEye";

/**
 * A decoded eye texture and the iris texels of each eye painted on it.
 *
 * @evidence contracts/common.md#principled-implementation Each globe texture is decoded once and every eye that shares it is painted on the same pixels.
 * @evidence contracts/common.md#clear-and-simple-design One named record holds the decoded image and its prepared eyes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The image is decoded from the basis texture, never substituted.
 * @evidence contracts/common.md#meaningful-documentation States the image layout and the eyes it carries.
 * @evidence contracts/modeling.md#spatial-conventions Width and height are pixels and rgba is row-major RGBA bytes.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record holds an image and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The painted texture is observed under the pigment rule that consumes it.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record carries an image, not an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived data, not a caller input.
 * @author Samchon
 */
export interface IHumanFaceIrisPreparedTexture {
  /** Image width, pixels. */
  width: number;

  /** Image height, pixels. */
  height: number;

  /** Row-major RGBA bytes. */
  rgba: Uint8Array;

  /** Eyes painted on this texture. */
  eyes: IHumanFaceIrisPaintedEye[];
}
