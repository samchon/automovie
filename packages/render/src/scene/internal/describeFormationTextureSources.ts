import type {
  IAutoMovieCompiledFormationLod,
  IAutoMovieRenderTextureResidency,
  IAutoMovieRenderTextureSource,
} from "@automovie/interface";

import type { IFormationTierRepresentation } from "./IFormationTierRepresentation";
import { readTextureSource } from "./readTextureSource";

/*
 * Describe every retained, reachable gait table from its actual owned texture.
 * The bound includes declared takes that have not yet been uploaded, because a
 * later seek can retain them in this context. It is not an observed GLuint
 * count. Owner tuples preserve arbitrary formation and gait names without
 * collisions. Successful formation release clears the owning tier map, making
 * observations empty. Failed release retains that map as conservative potential
 * ownership.
 */
export const describeFormationTextureSources: (
  formation: string,
  representations: ReadonlyMap<
    IAutoMovieCompiledFormationLod["tier"],
    IFormationTierRepresentation
  >,
  drawableTiers: ReadonlySet<IAutoMovieCompiledFormationLod["tier"]>,
) => NonNullable<IAutoMovieRenderTextureResidency["runtimeTextures"]> = (
  formation: string,
  representations: ReadonlyMap<
    IAutoMovieCompiledFormationLod["tier"],
    IFormationTierRepresentation
  >,
  drawableTiers: ReadonlySet<IAutoMovieCompiledFormationLod["tier"]>,
): NonNullable<IAutoMovieRenderTextureResidency["runtimeTextures"]> => {
  const sources: NonNullable<
    IAutoMovieRenderTextureResidency["runtimeTextures"]
  >[number][] = [];
  for (const [tier, representation] of representations) {
    if (!drawableTiers.has(tier) || representation.cycle === null) continue;
    for (const take of representation.cycle.takes.values()) {
      const owner: string = `formation-cycle:${JSON.stringify([formation, tier, take.gait])}`;
      const { asset: _asset, ...texture }: IAutoMovieRenderTextureSource =
        readTextureSource(owner, take.texture);
      sources.push({ owner, texture });
    }
  }
  return sources;
};
