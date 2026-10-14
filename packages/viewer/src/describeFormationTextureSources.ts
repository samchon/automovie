import type { IAutoMovieRenderTextureResidency, IAutoMovieRenderTextureSource } from "@automovie/engine";
import type { IAutoMovieCompiledFormationLod } from "@automovie/interface";

import type { IFormationTierRepresentation } from "./IFormationTierRepresentation.js";
import { readAutoMovieTextureSource } from "./readAutoMovieTextureSource.js";

/**
 * Describe every retained, reachable gait table from its actual owned texture.
 * The bound includes declared takes that have not yet been uploaded, because a
 * later seek can retain them in this context. It is not an observed GLuint count.
 * Owner tuples preserve arbitrary formation and gait names without collisions.
 * Successful formation release clears the owning tier map, making observations
 * empty. Failed release retains that map as conservative potential ownership.
 *
 * @evidence contracts/common.md#principled-implementation Enumerates each drawable tier's actual retained take textures and derives portable source metadata through readAutoMovieTextureSource; declared not-yet-uploaded takes count potential residency, not observed native GLuints, and JSON tuple owner identity preserves arbitrary formation/tier/gait names.
 * @evidence contracts/common.md#clear-and-simple-design Projects the existing owner map into the render inventory format rather than tracking a second texture cache or allocating diagnostic GPU resources.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads real texture dimensions/type/source state and actual drawable-tier membership without fixture resident counts; asset omission is appropriate for generated runtime tables rather than inventing an authored file identity.
 * @evidence contracts/common.md#meaningful-documentation Gives reachable/potential versus uploaded-native distinction, collision-free owner tuples and successful owning-map release observation; the formation retains its maps after failed release so uncertainty is not reported as an empty population.
 * @evidence contracts/performance.md#efficient-algorithms Visits T tier entries and K retained takes of drawable animated tiers, O(T+K) work and O(K) portable result storage; no image pixel decoding or population-slot traversal occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses owned DataTextures and canonical metadata extraction; mutable tier membership/source/upload state requires current reads, so no formation-name-only inventory cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows representation/texture objects and returns scalar source descriptions with generated owner strings; retains no native handle or task. The formation lifetime owner controls disposal and retains the existing map and resource closures after failure until that owner ends.
 */
export const describeFormationTextureSources: (formation: string, representations: ReadonlyMap<IAutoMovieCompiledFormationLod["tier"], IFormationTierRepresentation>, drawableTiers: ReadonlySet<IAutoMovieCompiledFormationLod["tier"]>) => NonNullable<IAutoMovieRenderTextureResidency["runtimeTextures"]> = (
  formation: string,
  representations: ReadonlyMap<IAutoMovieCompiledFormationLod["tier"], IFormationTierRepresentation>,
  drawableTiers: ReadonlySet<IAutoMovieCompiledFormationLod["tier"]>,
): NonNullable<IAutoMovieRenderTextureResidency["runtimeTextures"]> => {
  const sources: NonNullable<IAutoMovieRenderTextureResidency["runtimeTextures"]>[number][] = [];
  for (const [tier, representation] of representations) {
    if (!drawableTiers.has(tier) || representation.cycle === null) continue;
    for (const take of representation.cycle.takes.values()) {
      const owner: string = `formation-cycle:${JSON.stringify([formation, tier, take.gait])}`;
      const { asset: _asset, ...texture }: IAutoMovieRenderTextureSource = readAutoMovieTextureSource(owner, take.texture);
      sources.push({ owner, texture });
    }
  }
  return sources;
};
