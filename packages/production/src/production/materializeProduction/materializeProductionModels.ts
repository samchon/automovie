import { IAutoMovieModel, IAutoMovieModelRecipe } from "@automovie/interface";
import { compareCodeUnits } from "../contentIdentity";
import { AUTOMOVIE_REGISTERED_ARCHETYPES, AutoMovieModelArchetypeRegistry } from "../productionArchetypes";
import { type IAutoMovieExternalModelRuntimeBinding } from "./IAutoMovieExternalModelRuntimeBinding";
import { materializeModel } from "./materializeModel";

/**
 * Materialize recipes in canonical id order through the supplied registry and adopted external bindings.
 *
 * @evidence contracts/common.md#principled-implementation Code-unit sorting stabilizes recipe iteration; each registered builder receives unchanged parameters and generated runtime identities, with optional external facts replacing appearance/proxy metadata under existing policy.
 * @evidence contracts/common.md#clear-and-simple-design One recipe-to-model composition feeds the build's shot and population stages; archetype geometry and external provenance stay with their owning registry and inventory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Defaults remain an empty external map and the registered catalogue. Unknown archetypes throw, and parameter/palette/rig validity remains the preceding design/asset gates' premise rather than inferred replacement content.
 * @evidence contracts/common.md#meaningful-documentation Documents deterministic id order, registry/default ownership, generated versus imported composition and admission premises.
 * @evidence contracts/performance.md#efficient-algorithms For R recipes, sorting adds O(R log R) comparisons plus actual archetype build, palette selection and metadata copying costs; every recipe is materialized once here.
 * @evidence contracts/performance.md#reuse-equivalent-work One returned model map is shared by the same build's consumers; no cross-build cache assumes equal ids imply equal parameters, assets or registry strategies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns newly materialized models and their geometry/skeleton/profile/asset metadata; populations follow input recipes and builder output without a numeric cap or acquired native handle.
 *
 * @author Samchon
 */
export function materializeProductionModels(
  recipes: ReadonlyMap<string, IAutoMovieModelRecipe>,
  externalModels: ReadonlyMap<
    string,
    IAutoMovieExternalModelRuntimeBinding
  > = new Map(),
  archetypes: AutoMovieModelArchetypeRegistry = AUTOMOVIE_REGISTERED_ARCHETYPES,
): ReadonlyMap<string, IAutoMovieModel> { return new Map(
    [...recipes]
      .sort(([left]: [string, IAutoMovieModelRecipe], [right]: [string, IAutoMovieModelRecipe]) : number => compareCodeUnits(left, right))
      .map(
        ([id, recipe]: [string, IAutoMovieModelRecipe]) : readonly [string, IAutoMovieModel] =>
          [
            id,
            materializeModel(recipe, externalModels.get(id), archetypes),
          ] as const,
      ),
  ); }
