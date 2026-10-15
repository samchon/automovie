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
 * Construct the tier resources and bind their declared repertoire once.
 * A rejected model or cue releases tiers already constructed before refusing;
 * chunk instances are created only after this boundary succeeds.
 *
 * @evidence contracts/common.md#principled-implementation Resolves each declared LOD model, flattens/bakes it, registers its tier before custom shadow setup and validates requested gait names against the union repertoire; admitted unique tier identities are a premise, and a gait present in one tier may still fall back in another according to that cycle's selector.
 * @evidence contracts/common.md#clear-and-simple-design Owns the tier construction/admission transaction before anonymous chunks, delegating rigid flatten/bake, shadow material setup and independent resource retirement to their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing referenced models and absent declared repertoire refuse with real unit/tier/cue ids, not substitute fixtures; early tier registration prevents a shadow-setup refusal from hiding an already-acquired visible representation.
 * @evidence contracts/common.md#meaningful-documentation States tier/cue admission, rollback of already-constructed tiers and chunk-after-success ordering; actual repertoire union versus per-tier fallback is disclosed in the implementation answer.
 * @evidence contracts/performance.md#efficient-algorithms Constructs T declared tiers once with canonical per-model flatten/bake costs, collects K take names and scans Q relevant cues with Set membership; rollback visits unique resources across admitted tiers without scanning anonymous members.
 * @evidence contracts/performance.md#reuse-equivalent-work Builds one representation per declared tier for all later chunk borrowers and uses one repertoire Set during cue admission; independently mutable model/tier input has no immutable revision key for cross-build cache reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns each completed flattened tier before acquiring shadows and attempts all registered tier resources on any later refusal, preserving primary and cleanup causes; success transfers T tiers/textures/materials to the formation runtime, while nested constructors retire their own pre-return allocations.
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
