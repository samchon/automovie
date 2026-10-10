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
