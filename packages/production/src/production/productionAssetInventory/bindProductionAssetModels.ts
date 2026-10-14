import { type IAutoMovieAssetUse, AutoMovieHumanoidBone, IAutoMovieAssetProvenance } from "@automovie/interface";

import { compareCodeUnits } from "../contentIdentity";
import { IAutoMovieExternalModelRuntimeBinding } from "../materializeProduction";
import { requiredRecipeBones } from "./requiredRecipeBones";
import { isExternalModelAsset } from "./isExternalModelAsset";
import { type IProductionAssetInventoryContext } from "./IProductionAssetInventoryContext";

/**
 * Join current recipe asset uses to compatible inspected model LOD and weighted-rig facts.
 *
 * @evidence contracts/common.md#principled-implementation Reports missing model-recipe use, then creates a binding when inspected provenance, all declared LODs under one hero profile, static/articulated agreement and every registered recipe bone weighted in each articulated LOD match. Earlier use errors can coexist with that partial binding; final publication owns the error verdict.
 * @evidence contracts/common.md#clear-and-simple-design This phase connects inspected asset facts to recipe ids; materializeProductionModels consumes that map and productionProjectionRadii separately consumes its measurement envelope.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registry bone lists are the recipe premise; an unknown archetype yields the existing empty-list policy and later design/materialization gates own refusal. No bone mapping, missing LOD or external measurement is inferred.
 * @evidence contracts/common.md#meaningful-documentation Documents recipe/profile/weighted-bone admission, merged byte closure and the separate role of declared measurement envelopes.
 * @evidence contracts/performance.md#efficient-algorithms Repeated record/LOD searches, bone-by-mapping scans, closure merging and sorting contribute to total cost; large ledgers and rigs can make these joins nonlinear.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses externalByAsset inspections and deduplicates exact closure paths in the recipe's merged Map; it retains no cross-build asset binding cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned recipe bindings retain selected LOD metadata and collision/measurement facts borrowed from this inventory; source populations bound map growth without a numeric cap or acquired handle.
 *
 * @author Samchon
 */
export function bindProductionAssetModels(context: IProductionAssetInventoryContext): Map<string, IAutoMovieExternalModelRuntimeBinding> {
  const { records, externalByAsset, diagnostic, graph, archetypes, productionId }: IProductionAssetInventoryContext = context;
const externalModels: Map<string, IAutoMovieExternalModelRuntimeBinding> = new Map<
    string,
    IAutoMovieExternalModelRuntimeBinding
  >();
for (const [id, model] of graph.models) {
    if (model.asset === undefined) continue;
    const record: IAutoMovieAssetProvenance | undefined = records.find(
      (asset: IAutoMovieAssetProvenance) : boolean => asset.path === model.asset,
    );
    if (
      isExternalModelAsset(model.asset) === false ||
      record === undefined ||
      record.model === undefined ||
      record.uses.some(
        (use: IAutoMovieAssetUse) : boolean =>
          use.production === productionId &&
          use.consumer.kind === "model-recipe" &&
          use.consumer.id === id,
      ) === false
    )
      diagnostic(
        "asset-use-missing",
        model.asset,
        `Model recipe "${id}" consumes "${model.asset}" without external-model provenance and one matching typed use for production "${productionId}". Register the exact model bytes, model decisions and model-recipe use.`,
      );
    const external: Omit<IAutoMovieExternalModelRuntimeBinding, "asset" | "lod"> | undefined = externalByAsset.get(model.asset);
    if (
      record !== undefined &&
      record.model !== undefined &&
      external !== undefined
    ) {
      const levels: { level: "hero" | "near" | "far"; asset: string; digest: string; profile: "gltf-static-v1" | "gltf-humanoid-v1" | "vrm-humanoid-v1"; humanoidBones: { bone: AutoMovieHumanoidBone; node: number; weighted: boolean; }[]; }[] = record.model.lod.flatMap((lod: { level: "hero" | "near" | "far"; asset: string; }) : { level: "hero" | "near" | "far"; asset: string; digest: string; profile: "gltf-static-v1" | "gltf-humanoid-v1" | "vrm-humanoid-v1"; humanoidBones: { bone: AutoMovieHumanoidBone; node: number; weighted: boolean; }[]; }[] => {
        const levelRecord: IAutoMovieAssetProvenance | undefined = records.find(
          (candidate: IAutoMovieAssetProvenance) : boolean => candidate.path === lod.asset,
        );
        const level: Omit<IAutoMovieExternalModelRuntimeBinding, "asset" | "lod"> | undefined = externalByAsset.get(lod.asset);
        return levelRecord === undefined || level === undefined
          ? []
          : [
              {
                level: lod.level,
                asset: lod.asset,
                digest: levelRecord.digest,
                profile: level.profile,
                humanoidBones: level.humanoidBones,
              },
            ];
      });
      const recipeBones: readonly AutoMovieHumanoidBone[] = requiredRecipeBones(model, archetypes);
      const generatedHasSkeleton: boolean = recipeBones.length !== 0;
      const levelProfiles: Set<"gltf-static-v1" | "gltf-humanoid-v1" | "vrm-humanoid-v1"> = new Set(levels.map((level: { level: "hero" | "near" | "far"; asset: string; digest: string; profile: "gltf-static-v1" | "gltf-humanoid-v1" | "vrm-humanoid-v1"; humanoidBones: { bone: AutoMovieHumanoidBone; node: number; weighted: boolean; }[]; }) : "gltf-static-v1" | "gltf-humanoid-v1" | "vrm-humanoid-v1" => level.profile));
      if (
        levels.length !== record.model.lod.length ||
        levelProfiles.size !== 1 ||
        levelProfiles.has(external.profile) === false
      )
        diagnostic(
          "asset-model-lod-incompatible",
          model.asset,
          `Model recipe "${id}" requires every declared LOD to pass the same fixed ingest profile as its hero asset.`,
        );
      else if ((external.profile === "gltf-static-v1") === generatedHasSkeleton)
        diagnostic(
          "asset-model-rig-incompatible",
          model.asset,
          `Model recipe "${id}" and ingest profile "${external.profile}" disagree on whether the runtime is articulated. Bind static assets only to skeleton-free recipes and humanoid assets only to articulated recipes.`,
        );
      else if (
        generatedHasSkeleton &&
        levels.some((level: { level: "hero" | "near" | "far"; asset: string; digest: string; profile: "gltf-static-v1" | "gltf-humanoid-v1" | "vrm-humanoid-v1"; humanoidBones: { bone: AutoMovieHumanoidBone; node: number; weighted: boolean; }[]; }) : boolean =>
          recipeBones.some(
            (bone: AutoMovieHumanoidBone) : boolean =>
              level.humanoidBones.some(
                (mapping: { bone: AutoMovieHumanoidBone; node: number; weighted: boolean; }) : boolean => mapping.bone === bone && mapping.weighted,
              ) === false,
          ),
        )
      )
        diagnostic(
          "asset-model-rig-incompatible",
          model.asset,
          `Model recipe "${id}" requires normalized, visibly weighted skeleton bones that at least one ingested LOD does not prove.`,
        );
      else {
        const assets: Map<string, string> = new Map(
          levels.flatMap((level: { level: "hero" | "near" | "far"; asset: string; digest: string; profile: "gltf-static-v1" | "gltf-humanoid-v1" | "vrm-humanoid-v1"; humanoidBones: { bone: AutoMovieHumanoidBone; node: number; weighted: boolean; }[]; }) : (readonly [string, string])[] =>
            externalByAsset
              .get(level.asset)!
              .assets.map((entry: { path: string; digest: string; }) : readonly [string, string] => [entry.path, entry.digest] as const),
          ),
        );
        externalModels.set(id, {
          asset: model.asset,
          ...external,
          lod: levels,
          assets: [...assets]
            .map(([path, digest]: [string, string]) : { path: string; digest: string; } => ({ path, digest }))
            .sort((left: { path: string; digest: string; }, right: { path: string; digest: string; }) : number => compareCodeUnits(left.path, right.path)),
        });
      }
    }
  }
  return externalModels;
}
