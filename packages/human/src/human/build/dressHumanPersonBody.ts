import type { IHumanPersonBodyDressInput } from "../structures/IHumanPersonBodyDressInput";
import type { IHumanPersonDressedBody } from "../structures/IHumanPersonDressedBody";

/**
 * Register fabric material while retaining the body's original skin regions.
 * The Person consumer places or stitches those source corners first, completes
 * any anatomical layer readings on the original skin, and only then partitions
 * the actual final render regions with the prepared rest coverage. No before-
 * join clothing geometry is carried into the joined person.
 *
 * @evidence contracts/common.md#principled-implementation Prepared coverage stays separate from the Body build until the final Person source correspondence exists.
 * @evidence contracts/common.md#clear-and-simple-design One named body/recipe result separates serializable Body output from internal material data.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registers only the producer's reserved material identity and changes no source geometry.
 * @evidence contracts/common.md#meaningful-documentation States when final skin partition runs and why the Body corner population remains unchanged.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Final region composition names the parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels The prepared owner admits style and colour.
 * @evidenceExclude contracts/modeling.md#emitted-geometry This registration emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions No coordinates are transformed.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The final material partition constructs the common contour.
 * @evidenceExclude contracts/modeling.md#rendered-observation Final Body and Person consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source owners retain their original domains.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no authoring control.
 */
export function dressHumanPersonBody(
  input: IHumanPersonBodyDressInput,
): IHumanPersonDressedBody {
  const garment = input.prepared.dress();
  if (garment === undefined) return { body: input.body };
  return {
    garment,
    body: { ...input.body, model: { ...input.body.model,
      materials: [...input.body.model.materials, garment.material],
    } },
  };
}
