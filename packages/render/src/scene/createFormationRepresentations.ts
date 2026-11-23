import type {
  IAutoMovieCompiledFormationLod,
  IAutoMovieModel,
} from "@automovie/interface";

import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle.js";
import type { IAutoMovieInstancedModelRepresentation } from "./IAutoMovieInstancedModelRepresentation.js";
import type { IBuildInstancedFormationProps } from "./IBuildInstancedFormationProps.js";
import type { IFormationTierRepresentation } from "./IFormationTierRepresentation.js";
import { applyFormationCycleMaterial } from "./applyFormationCycleMaterial.js";
import { createFormationCycleShadowMaterials } from "./createFormationCycleShadowMaterials.js";
import { disposeFormationRepresentations } from "./disposeFormationRepresentations.js";
import { flattenInstancedModel } from "./flattenInstancedModel.js";
import { reportAutoMovieResourceRetirement } from "./reportAutoMovieResourceRetirement.js";

/**
 * Construct the tier resources and bind their declared repertoire once. A
 * rejected model or cue releases tiers already constructed before refusing;
 * chunk instances are created only after this boundary succeeds.
 */
export const createFormationRepresentations: (
  input: IBuildInstancedFormationProps,
) => Map<
  IAutoMovieCompiledFormationLod["tier"],
  IFormationTierRepresentation
> = (
  input: IBuildInstancedFormationProps,
): Map<
  IAutoMovieCompiledFormationLod["tier"],
  IFormationTierRepresentation
> => {
  const representations: Map<
    "hero" | "near" | "far",
    IFormationTierRepresentation
  > = new Map<
    IAutoMovieCompiledFormationLod["tier"],
    IFormationTierRepresentation
  >();
  try {
    for (const lod of input.formation.lod) {
      const model: IAutoMovieModel | undefined = input.models.get(
        lod.runtimeModel,
      );
      if (model === undefined)
        throw new Error(
          `Formation "${input.formation.id}" LOD "${lod.tier}" references missing runtime model "${lod.runtimeModel}".`,
        );
      const representation: IAutoMovieInstancedModelRepresentation<IAutoMovieFormationCycle | null> =
        flattenInstancedModel(
          model,
          `Formation "${input.formation.id}" LOD "${lod.tier}"`,
          {},
        );
      const cycle: IAutoMovieFormationCycle | null = representation.cycle;
      const tier: IFormationTierRepresentation = {
        ...representation,
        shadows: null,
      };
      representations.set(lod.tier, tier);
      if (cycle !== null)
        tier.shadows = createFormationCycleShadowMaterials(
          cycle,
          representation.materials,
        );
      if (cycle !== null)
        for (const material of new Set(tier.materials))
          applyFormationCycleMaterial(material, cycle);
    }
    const repertoire: Set<string> = new Set(
      [...representations.values()].flatMap(
        (tier: IFormationTierRepresentation): string[] =>
          tier.cycle === null ? [] : [...tier.cycle.takes.keys()],
      ),
    );
    if (repertoire.size !== 0)
      for (const cue of input.motions ?? [])
        if (
          cue.formation === input.formation.id &&
          cue.gait !== undefined &&
          repertoire.has(cue.gait) === false
        )
          throw new Error(
            `Formation "${input.formation.id}" cue "${cue.id}" calls for gait "${cue.gait}", which no runtime model of this unit declares.`,
          );
    return representations;
  } catch (error) {
    reportAutoMovieResourceRetirement(
      [(): void => disposeFormationRepresentations(representations.values())],
      { error },
    );
    throw error;
  }
};
