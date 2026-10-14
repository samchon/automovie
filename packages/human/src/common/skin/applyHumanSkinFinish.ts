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
 * @evidence contracts/common.md#principled-implementation The first material whose ID equals HUMAN_SKIN_FINISH.material receives the source-owned RGB scattering distances.
 * @evidence contracts/common.md#clear-and-simple-design An in-place material update leaves geometry, albedo and unrelated materials with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing skin leaves the input unchanged and a spread copy prevents the recipient from mutating the shared scattering record.
 * @evidence contracts/common.md#meaningful-documentation The prose states the body's fresh-copy call boundary, mutation ownership, absent-material behavior and independent scattering copy.
 * @evidence contracts/performance.md#efficient-algorithms A single find scans at most M materials and assigning three scattering components costs constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Each material comparison reads the shared HUMAN_SKIN_FINISH identity; the matched material copies its scattering values without retaining a cross-call result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains its materials; only the matched material owns the new three-component scattering record, with no global retention.
 */
export function applyHumanSkinFinish(
  materials: readonly IAutoMovieMaterial[],
): void {
  const skin: IAutoMovieMaterial | undefined = materials.find(
    (material: IAutoMovieMaterial): boolean => material.id === HUMAN_SKIN_FINISH.material,
  );
  if (skin !== undefined)
    skin.subsurfaceRadius = { ...HUMAN_SKIN_FINISH.scattering };
}
