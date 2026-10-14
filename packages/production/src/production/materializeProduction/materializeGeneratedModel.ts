import { type IAutoMovieMaterial, IAutoMovieModel, IAutoMovieModelRecipe } from "@automovie/interface";
import { type IAutoMovieModelArchetype, type IAutoMovieArchetypeGeometry } from "@automovie/archetypes";
import { productionRuntimeModelId, productionRuntimeSkeletonId } from "@automovie/engine";
import { AutoMovieModelArchetypeRegistry } from "../productionArchetypes";
import { materialOf } from "./materialOf";

/**
 * Build one admitted recipe through its exact registered archetype and stable runtime identities.
 *
 * @evidence contracts/common.md#principled-implementation Registry lookup chooses the builder or throws the existing unknown-archetype Error; unchanged parameters, one selected material id and generated skeleton id feed build before recipe profiles are cloned.
 * @evidence contracts/common.md#clear-and-simple-design The registry owns geometry and skeleton strategy, materialOf owns palette decoding/defaults and this owner assembles their model result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unknown recipe is replaced with a shipped asset or inferred builder. Parameter/profile validity remains the preceding design gate's premise, and the returned geometry is the builder's actual output.
 * @evidence contracts/common.md#meaningful-documentation Documents registry failure, unchanged parameters, runtime ids, generated metadata and borrowed strategy ownership.
 * @evidence contracts/performance.md#efficient-algorithms Includes registry lookup, full palette selection and actual builder workload plus profile cloning; geometry cost follows the selected archetype's parameters/output resolution.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares registry strategies but executes each actual recipe build; equal archetype names alone cannot cache differing parameter/profile results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources New model/material/profile metadata and builder geometry/skeleton transfer to the caller; the archetype retains strategy lifetime and this owner opens no native resource.
 *
 * @author Samchon
 */
export function materializeGeneratedModel(
  recipe: IAutoMovieModelRecipe,
  archetypes: AutoMovieModelArchetypeRegistry,
): IAutoMovieModel {
  const archetype: IAutoMovieModelArchetype | undefined = archetypes.get(recipe.archetype);
  if (archetype === undefined)
    throw new Error(
      `Model recipe "${recipe.id}" names archetype "${recipe.archetype}", which is not registered with this builder. Register a builder for it, or name a registered archetype in the tracked model recipe record; the design gate refuses an unregistered archetype before compilation reaches geometry.`,
    );
  const material: IAutoMovieMaterial = materialOf(recipe);
  const geometry: IAutoMovieArchetypeGeometry = archetype.build({
    parameters: recipe.parameters,
    material: material.id,
    skeleton: productionRuntimeSkeletonId(recipe.id),
  });
  return {
    id: productionRuntimeModelId(recipe.id),
    name: `${recipe.archetype} recipe ${recipe.id}`,
    origin: "generated" as const,
    body: null,
    affordances: null,
    materials: [material],
    asset: null,
    profiles: structuredClone(recipe.profiles ?? []),
    skeleton: geometry.skeleton,
    parts: geometry.parts,
  };
}
