import type { IAutoMovieModelLodRecipe, IAutoMovieCompiledFormationLod, IAutoMovieModelRecipe } from "@automovie/interface";


import { productionRuntimeModelId } from "../productionRuntimeModelId";
import { compiledLodRecipeDigest } from "./compiledLodRecipeDigest";

/**
 * The compiled tiers and measured or fallback radius of one population prototype.
 *
 * A formation's anonymous members and each prototype of an instance set are
 * drawn the same way: through the recipe's declared tiers, or through one `near`
 * tier of the base recipe when it declares none, each bound to its recipe
 * digest and runtime model id. The member radius is the largest radius over
 * those tiers, where a tier whose recipe has no known radius borrows the base
 * recipe's, and one with neither is half a metre; no member is ever smaller
 * than a centimetre for projection. Only supplied measurements support an
 * enclosure claim; the fallback is a legacy estimate for missing geometry.
 *
 * Radii are supplied by the host. The archetype catalogue that measures a
 * generated recipe and the adopted proxy that measures an external model are
 * the host's composition, so this reads a table and never a registry.
 *
 * The caller chooses which declared tiers apply: a formation's anonymous batch
 * drops the `hero` tier, which is drawn by named nodes, while an instance set
 * has no heroes and keeps every tier. Shared by both kernels; package-private.
 *
 * @evidence contracts/common.md#principled-implementation Bind applicable tiers to canonical recipe digests and runtime model ids, defaulting an empty list to base near; choose the maximum supplied tier radius with base then 0.5m fallback and a 0.01m floor. Missing measurements do not prove conservative enclosure.
 * @evidence contracts/common.md#clear-and-simple-design The host chooses applicable tiers and measures geometry; this shared helper composes those inputs without importing an archetype registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The explicit legacy radius fallback and near-tier default remain caller policy; neither a recipe id nor expected viewport result selects a hidden measurement.
 * @evidence contracts/common.md#meaningful-documentation Docs distinguish measured radii from fallback estimates, metre units, caller-selected hero filtering and per-tier model/digest references.
 * @evidence contracts/performance.md#efficient-algorithms T tiers require O(T) map lookups plus canonicalization/hash cost of referenced recipe bytes and O(T) returned records; the argument spread still scales with admitted tier count.
 * @evidence contracts/performance.md#reuse-equivalent-work Formation and instance compilers share this representation owner; tier digests are recomputed because recipe maps and measured radii can mutate.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only fresh tier records and one radius transfer to the caller; no registry, measurement task or cache is retained.
 */
export const compiledPopulationRepresentation: (props: { /** Base model recipe the population prototype names. */ modelRecipe : string ; /** Declared tiers that apply to this population, before the default. */ tiers : IAutoMovieModelRecipe [ "lod" ] ; /** Model recipes keyed by id, for tier digests. */ recipes : ReadonlyMap < string , IAutoMovieModelRecipe > ; /** Conservative member radius in metres keyed by recipe id. */ projectionRadii : ReadonlyMap < string , number > ; }) => { lod : IAutoMovieCompiledFormationLod [ ] ; projectionRadius : number } = (props: {
  /** Base model recipe the population prototype names. */
  modelRecipe: string;
  /** Declared tiers that apply to this population, before the default. */
  tiers: IAutoMovieModelRecipe["lod"];
  /** Model recipes keyed by id, for tier digests. */
  recipes: ReadonlyMap<string, IAutoMovieModelRecipe>;
  /** Conservative member radius in metres keyed by recipe id. */
  projectionRadii: ReadonlyMap<string, number>;
}): { lod: IAutoMovieCompiledFormationLod[]; projectionRadius: number } => {
  const lod: { recipeDigest: string; model: string; tier: "hero" | "near" | "far"; maxDistance: number | null; recipe: string; }[] = (
    props.tiers.length === 0
      ? [
          {
            tier: "near" as const,
            maxDistance: null,
            recipe: props.modelRecipe,
          },
        ]
      : props.tiers
  ).map((item: IAutoMovieModelLodRecipe) : { recipeDigest: string; model: string; tier: "hero" | "near" | "far"; maxDistance: number | null; recipe: string; } => ({
    ...item,
    recipeDigest: compiledLodRecipeDigest(props.recipes, item.recipe),
    model: productionRuntimeModelId(item.recipe),
  }));
  return {
    lod,
    projectionRadius: Math.max(
      0.01,
      ...lod.map(
        (item: { recipeDigest: string; model: string; tier: "hero" | "near" | "far"; maxDistance: number | null; recipe: string; }) : number =>
          props.projectionRadii.get(item.recipe) ??
          props.projectionRadii.get(props.modelRecipe) ??
          0.5,
      ),
    ),
  };
};
