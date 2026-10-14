import { type IAutoMovieModelLodRecipe, type IAutoMovieInstancePrototypeDesign, AutoMovieDiagnosticCode } from "@automovie/interface";
import { IAutoMovieExternalModelRuntimeBinding } from "../materializeProduction";
import { IAutoMovieProductionDesignGraph } from "../validateProductionDesign";

/**
 * Append existing unsupported imported-population findings without changing recipe selection or fallback policy.
 *
 * @evidence contracts/common.md#principled-implementation Formation base/nonhero recipe selections refuse any adopted external appearance; general instance-set prototypes and their LOD recipes permit only adopted rigid gltf-static-v1 profiles.
 * @evidence contracts/common.md#clear-and-simple-design One production gate separates current formation and general-instance support while engine population kernels keep their existing tier selection/fallback behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It adds no imported renderer or alternate recipe, and absence from externalModels is not proof of an imported profile. Broader source/model errors remain the caller's build gate.
 * @evidence contracts/common.md#meaningful-documentation Documents the exact existing formation versus rigid-instance support and diagnostic-only effect.
 * @evidence contracts/performance.md#efficient-algorithms Scans selected recipe/LOD/prototype lists, deduplicates instance recipes with a Set and performs expected constant map lookups; no geometry or byte decoding occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares current adopted binding facts for profile decisions without retaining cross-build support verdicts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only diagnostic strings escape; temporary recipe arrays/Sets retire with the call and no rendering resource is acquired.
 *
 * @author Samchon
 */
export function refuseUnsupportedExternalInstancing(
  graph: IAutoMovieProductionDesignGraph,
  externalModels: ReadonlyMap<string, IAutoMovieExternalModelRuntimeBinding>,
  diagnostic: (
    code: AutoMovieDiagnosticCode,
    target: string,
    message: string,
  ) => void,
): void {
  for (const formation of graph.formations.values()) {
    const recipes: string[] = [
      formation.modelRecipe,
      ...(graph.models
        .get(formation.modelRecipe)
        ?.lod.filter((lod: IAutoMovieModelLodRecipe) : boolean => lod.tier !== "hero")
        .map((lod: IAutoMovieModelLodRecipe) : string => lod.recipe) ?? []),
    ];
    if (recipes.some((recipe: string) : boolean => externalModels.has(recipe)))
      diagnostic(
        "asset-model-instancing-unsupported",
        formation.id,
        `Formation "${formation.id}" selects a registered external model for anonymous members, but imported-mesh instancing is not yet supported. Use generated anonymous tiers or named hero nodes.`,
      );
  }
  for (const instanceSet of graph.world?.instanceSets ?? []) {
    const recipes: string[] = [
      instanceSet.modelRecipe,
      ...(instanceSet.prototypes ?? []).map(
        (prototype: IAutoMovieInstancePrototypeDesign) : string => prototype.modelRecipe,
      ),
    ].flatMap((recipe: string) : string[] => [
      recipe,
      ...(graph.models.get(recipe)?.lod.map((lod: IAutoMovieModelLodRecipe) : string => lod.recipe) ?? []),
    ]);
    for (const recipe of new Set(recipes)) {
      const external: IAutoMovieExternalModelRuntimeBinding | undefined = externalModels.get(recipe);
      if (external !== undefined && external.profile !== "gltf-static-v1")
        diagnostic(
          "asset-model-instancing-unsupported",
          instanceSet.id,
          `Instance set "${instanceSet.id}" selects external model "${recipe}" with profile "${external.profile}". General instancing accepts only rigid gltf-static-v1 prototypes; use named nodes for skinned, morphed, or animated assets.`,
        );
    }
  }
}
