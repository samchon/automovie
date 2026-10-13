import type { IAutoMovieCompiledFormationLod } from "@automovie/interface";

import type { IBuildInstancedFormationProps } from "./IBuildInstancedFormationProps.js";
import type { IFormationTierRepresentation } from "./IFormationTierRepresentation.js";
import { applyFormationCycleMaterial } from "./applyFormationCycleMaterial.js";
import { createFormationCycleShadowMaterials } from "./createFormationCycleShadowMaterials.js";
import { disposeFormationRepresentations } from "./disposeFormationRepresentations.js";
import { flattenInstancedModel } from "./flattenInstancedModel.js";

/**
 * Construct the tier resources and bind their declared repertoire once.
 * A rejected model or cue releases tiers already constructed before refusing;
 * chunk instances are created only after this boundary succeeds.
 *
 * @evidence requirements/lighting/shadows-reflections-and-transmission.md#lighting-shadow-time-sampling Constructs shadow projections only for tiers with a real baked cycle.
 * @evidence specifications/camera-light-and-visibility/light-transport-color-and-budget.md#clv-shadow-state-sampling Binds each shadow projection to the same mutable cells as its tier's beauty materials.
 */
export const createFormationRepresentations = (
  input: IBuildInstancedFormationProps,
): Map<IAutoMovieCompiledFormationLod["tier"], IFormationTierRepresentation> => {
  const representations = new Map<
    IAutoMovieCompiledFormationLod["tier"],
    IFormationTierRepresentation
  >();
  try {
    for (const lod of input.formation.lod) {
      const model = input.models.get(lod.model);
      if (model === undefined)
        throw new Error(
          `Formation "${input.formation.id}" LOD "${lod.tier}" references missing runtime model "${lod.model}".`,
        );
      const representation = flattenInstancedModel(
        model, `Formation "${input.formation.id}" LOD "${lod.tier}"`, {},
      );
      const cycle = representation.cycle;
      const tier: IFormationTierRepresentation = {
        ...representation,
        shadows: cycle === null ? null : createFormationCycleShadowMaterials(cycle, representation.materials),
      };
      representations.set(lod.tier, tier);
      if (cycle !== null)
        for (const material of new Set(tier.materials))
          applyFormationCycleMaterial(material, cycle);
    }
    const repertoire = new Set(
      [...representations.values()].flatMap((tier) =>
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
    disposeFormationRepresentations(representations.values());
    throw error;
  }
};
