import type { IAutoMovieRenderTextureResidency } from "@automovie/engine";
import type { IAutoMovieCompiledFormationLod } from "@automovie/interface";

import type { IFormationTierRepresentation } from "./IFormationTierRepresentation.js";
import { readAutoMovieTextureSource } from "./readAutoMovieTextureSource.js";

/**
 * Describe every retained, reachable gait table from its actual owned texture.
 * The bound includes declared takes that have not yet been uploaded, because a
 * later seek can retain them in this context. It is not an observed GLuint count.
 * Owner tuples preserve arbitrary formation and gait names without collisions.
 * Clearing the owning tier map at release makes subsequent observations empty.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies decoded float-table dimensions and real upload policy for all retained formation takes.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Connects actual runtime table facts to the context-level residency lane without caller byte estimates.
 */
export const describeFormationTextureSources = (
  formation: string,
  representations: ReadonlyMap<IAutoMovieCompiledFormationLod["tier"], IFormationTierRepresentation>,
  drawableTiers: ReadonlySet<IAutoMovieCompiledFormationLod["tier"]>,
): NonNullable<IAutoMovieRenderTextureResidency["runtimeTextures"]> => {
  const sources: NonNullable<IAutoMovieRenderTextureResidency["runtimeTextures"]>[number][] = [];
  for (const [tier, representation] of representations) {
    if (!drawableTiers.has(tier) || representation.cycle === null) continue;
    for (const take of representation.cycle.takes.values()) {
      const owner = `formation-cycle:${JSON.stringify([formation, tier, take.gait])}`;
      const { asset: _asset, ...texture } = readAutoMovieTextureSource(owner, take.texture);
      sources.push({ owner, texture });
    }
  }
  return sources;
};
