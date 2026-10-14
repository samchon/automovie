import { IAutoMovieModelRecipe } from "@automovie/interface";

import type { IAutoMovieExternalModelRuntimeBinding } from "./materializeProduction";
import {
  AUTOMOVIE_REGISTERED_ARCHETYPES,
  AutoMovieModelArchetypeRegistry,
} from "./productionArchetypes";

/**
 * Declared radius estimate of every recipe a population can select.
 *
 * The builder shares this table with formation and instance-set materialization
 * and the compiled-shot join. External measurement envelopes supply population
 * selection radii; actor distance and skeletal reach do not read this table.
 * Half diagonals bound origin-centered envelopes, but external proxy admission
 * does not prove centering at the slot root or agreement with appearance bytes.
 * Humanoid envelopes omit depth, so these estimates cannot guarantee complete
 * root-centered visible-mesh coverage.
 * Unknown recipes remain absent for the population kernel's base-recipe and
 * half-metre fallback.
 *
 * @evidence contracts/common.md#principled-implementation External boxes use half the 3D diagonal and humanoid envelopes use half the height/maximum-width diagonal; registered archetypes own generated radii. Consumers place spheres at slot or actor roots, but external centering and humanoid depth are unproved, so the external estimates are not guaranteed visible-mesh bounds.
 * @evidence contracts/common.md#clear-and-simple-design One host-composition table joins adopted external envelopes and registered generated recipe measurements before engine population materialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown recipes are omitted; engine population kernels own their base-recipe and half-metre fallbacks, which are existing policy rather than proved bounds of an unknown tier. External half diagonals retain the unverified centering premise instead of claiming mesh containment.
 * @evidence contracts/common.md#meaningful-documentation States consumers, radius derivation, missing-tier fallback and unproved external center/depth premises, plus the distinction from distance and reach.
 * @evidence contracts/performance.md#efficient-algorithms For R recipe and E external keys, a union visits every distinct key once using O(R+E) temporary and result storage, plus registered radius-algorithm costs. External lookup takes precedence without materializing mesh geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work One table serves the attempt's formation, instance-set and shot phases; no cross-attempt cache assumes mutable recipe or envelope equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The key union is local and the result transfers to the build attempt, bounded by distinct input keys; no handle or task is acquired.
 */
export function productionProjectionRadii(recipes: ReadonlyMap<string, IAutoMovieModelRecipe>, externalModels: ReadonlyMap<
    string,
    IAutoMovieExternalModelRuntimeBinding
  > = new Map(), archetypes: AutoMovieModelArchetypeRegistry = AUTOMOVIE_REGISTERED_ARCHETYPES): ReadonlyMap<string, number> {
  const radii: Map<string, number> = new Map<string, number>();
  for (const id of new Set([...recipes.keys(), ...externalModels.keys()])) {
    const radius: number | null = recipeProjectionRadius(
      recipes.get(id),
      externalModels.get(id),
      archetypes,
    );
    if (radius !== null) radii.set(id, radius);
  }
  return radii;
}

/** One recipe's radius from its adopted proxy or its registered archetype. */
function recipeProjectionRadius(recipe: IAutoMovieModelRecipe | undefined, external: IAutoMovieExternalModelRuntimeBinding | undefined, archetypes: AutoMovieModelArchetypeRegistry): number | null {
  if (external !== undefined)
    return external.measurement.recipe === "box-v1"
      ? Math.hypot(
          external.measurement.parameters.width,
          external.measurement.parameters.height,
          external.measurement.parameters.depth,
        ) / 2
      : Math.hypot(
          Math.max(
            external.measurement.parameters.shoulderWidth,
            external.measurement.parameters.hipWidth,
          ),
          external.measurement.parameters.height,
        ) / 2;
  if (recipe === undefined) return null;
  // An unregistered archetype has no measurement of its own, and selection runs
  // before the design gate can refuse it. Answering "unknown" lets the caller
  // fall back to its declared default instead of inventing a bound here.
  const archetype: ReturnType<AutoMovieModelArchetypeRegistry["get"]> = archetypes.get(recipe.archetype);
  return archetype === undefined
    ? null
    : archetype.projectionRadius(recipe.parameters);
}
