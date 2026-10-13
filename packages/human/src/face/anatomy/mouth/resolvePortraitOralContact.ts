import type { IAutoMovieModelPart } from "@automovie/interface";

import { applyPortraitOralContact } from "./applyPortraitOralContact";

/**
 * Keep the enamel of the built face behind the lips and in front of the oral cavity, whichever of the two arches and the cavity the face has.
 *
 * Teeth cannot pass through the lip they sit behind, and the lining cannot pass through the teeth it encloses, yet each component fits itself alone, so the assembled parts can cross. This applies the directional contact of `applyPortraitOralContact` to each resident arch in turn, in the head's metre frame, with zero clearance: touching at most. An arch retreats posteriorly as one rigid body behind the lips; a present cavity is then pushed back behind it, while a closed mouth, which has no cavity, only retreats its enamel. Faces without lips or without an arch are returned as they are. The part identities are those the mouth, cavity and dental components emit (`lips`, `oral-cavity`, `tooth-upper-arch`, `tooth-lower-arch`), and other parts are retained. The fit measures along Z, so it resolves what a frontal view sees; contact of the enamel with the tongue or with a cavity wall that encloses it sideways is not resolved.
 *
 * @evidence contracts/common.md#principled-implementation Each resident named arch receives the same zero-gap directional relationship to lips and optional cavity.
 * @evidence contracts/common.md#clear-and-simple-design Missing lips/arches preserve the original parts while upper/lower arches apply one shared fitting owner sequentially.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Z-direction fitting does not resolve tongue contact or sidewall volume overlap, and no added thickness is inferred.
 * @evidence contracts/common.md#meaningful-documentation Generated part identities and head-frame metres determine this assembled compatibility relation.
 * @evidence contracts/performance.md#efficient-algorithms Part existence scans and at most two directional triangle fitting passes dominate cost.
 * @evidence contracts/performance.md#reuse-equivalent-work applyPortraitOralContact supplies canonical retreat and lining behavior rather than per-arch formulas.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fitted meshes are owned while untouched resident parts stay borrowed; no assembled contact cache is retained.
 *
 * @author Samchon
 */
export function resolvePortraitOralContact(
  parts: IAutoMovieModelPart[],
): IAutoMovieModelPart[] {
  const has: (id: string) => boolean = (id: string): boolean => parts.some((part: IAutoMovieModelPart): boolean => part.id === id);
  if (!has("lips")) return parts;
  return ["tooth-upper-arch", "tooth-lower-arch"].filter(has).reduce(
    (resolved: IAutoMovieModelPart[], enamel: string): IAutoMovieModelPart[] =>
      applyPortraitOralContact(resolved, {
        lips: "lips",
        enamel,
        cavity: has("oral-cavity") ? "oral-cavity" : undefined,
        clearance: 0,
      }),
    parts,
  );
}
