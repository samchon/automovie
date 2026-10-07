import type { IAutoMovieMaterial } from "@automovie/interface";

import { HUMAN_SKIN_FINISH } from "./HUMAN_SKIN_FINISH";

/**
 * Give a model's skin material the shared skin finish.
 *
 * The body builder calls this on its fresh material copies after document
 * overrides. Other builders can reuse it to apply the same source-owned
 * scattering to their skin materials. A model without a skin
 * material is left unchanged. The material is mutated in place and receives
 * its own copy of the scattering record.
 *
 * @evidence contracts/common.md#principled-implementation One function writes the complete source-owned finish, allowing other builders to reuse the body's assignment without duplicating values.
 * @evidence contracts/common.md#clear-and-simple-design A lookup and one assignment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The material is found by the shared id; no basis or renderer is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the callers, the order and the mutation.
 * @evidence contracts/modeling.md#shared-boundaries Consumers can apply this function to both sides of a skin join to give them the same finish; the body builder uses it here.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The function converts nothing; the record states its units.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming model's visual verification owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The finish record owns the value's source.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no authoring input.
 */
export function applyHumanSkinFinish(
  materials: readonly IAutoMovieMaterial[],
): void {
  const skin = materials.find(
    (material) => material.id === HUMAN_SKIN_FINISH.material,
  );
  if (skin !== undefined)
    skin.subsurfaceRadius = { ...HUMAN_SKIN_FINISH.scattering };
}
