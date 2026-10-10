import type { IHumanPersonBodyDressInput } from "../structures/IHumanPersonBodyDressInput";
import type { IHumanPersonDressedBody } from "../structures/IHumanPersonDressedBody";

/**
 * Register fabric material while retaining the body's original skin regions.
 * The Person consumer places or stitches those source corners first, completes
 * any anatomical layer readings on the original skin, and only then partitions
 * the actual final render regions with the prepared rest coverage. No before-
 * join clothing geometry is carried into the joined person.
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
