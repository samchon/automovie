import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieDesignEvidence,
  IAutoMovieDesignLineage,
  IAutoMovieDesignReference,
  IAutoMovieEffectRecipe,
  IAutoMovieFluidDomain,
  IAutoMovieFormationMotion,
  IAutoMovieFormationSlotMotion,
  IAutoMovieInstanceSetDesign,
  IAutoMovieModel,
  IAutoMovieMotion,
  IAutoMoviePlantingCluster,
  IAutoMoviePlantingDomain,
  IAutoMoviePlantingInstallation,
  IAutoMoviePropSpec,
  IAutoMovieServiceNetwork,
  IAutoMovieShotActorProgram,
  IAutoMovieShotEffectCue,
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftFurnishing,
  IAutoMovieSpace,
  IAutoMovieStageSetPiece,
  IAutoMovieWaterFeature,
  IAutoMovieWorldEffectZone,
  IAutoMovieWorldLandmark,
  IAutoMovieWorldRoute,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

/**
 *
 * What one subject puts into the shot it appears in.
 *
 * A shot program is assembled from many subjects, so no subject returns one.
 * Each returns only the parts it owns, and the shot merges them. That is what
 * lets a group be its clusters and a village be its buildings without any of
 * them knowing they were composed.
 *
 * Every field is optional because most subjects fill one or two. A prop
 * standing in the background contributes world geometry and nothing else; a
 * performer contributes an actor and its clips; a formation contributes compact
 * cues that the engine expands from count, layout, anchor, facing, and seed
 * rather than into per-member nodes.
 *
 * `mergeAutoMovieSubjectContributions` concatenates each field across subjects
 * in the order given and drops empty arrays. It walks its own hand-written list
 * of these field names, so a field added here must also be added there or the
 * merge silently leaves it out.
 *
 * @evidence contracts/common.md#principled-implementation A record of optional read-only arrays, one per program section a subject can own, so merging is per-field concatenation that needs no knowledge of what any entry means.
 * @evidence contracts/common.md#clear-and-simple-design Every section is optional and independently typed, so a prop fills only `set` or `models` and a performer only `actors` and `clips`, and the merge treats all 27 sections alike without a discriminant.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The section names are restated in the merge's `CONTRIBUTION_KEYS` with no compile-time exhaustiveness check; the 27 names match today, but a section added here alone would be dropped without an error.
 * @evidence contracts/common.md#meaningful-documentation States why no subject returns a whole program, why every section is optional, that formations contribute compact cues, the provenance-only role of design references, and the merge's separate key list.
 * @evidenceExclude contracts/performance.md#cost-and-resources Declares data only; merging is linear in contributed entries and that cost belongs to the merge function. A contribution is produced once per subject per shot build and consumed by one merge. Holds read-only arrays referencing subject-owned records; the merged program the caller builds decides how long those entries live.
 * @author Samchon
 */
export interface IAutoMovieSubjectContribution {
  /** Source-authored models this subject makes available to the shot. */
  models?: readonly IAutoMovieModel[];

  /** Static visible placements this subject adds to the staged set. */
  set?: readonly IAutoMovieStageSetPiece[];

  /**
   * Locomotion spaces this subject contributes for later deterministic merge.
   */
  spaces?: readonly IAutoMovieSpace[];

  /** Structured buildings retained for spatial queries and evidence. */
  builtEnvironments?: readonly IAutoMovieBuiltEnvironment[];

  /**
   * Observation documents the building source read, carried as provenance.
   *
   * A reading is not a design. These travel beside the building so the builder
   * can hold each one against the bytes it claims to have observed, and they
   * never become geometry on their own.
   */
  designReferences?: readonly IAutoMovieDesignReference[];

  /** Citations from authored design members back to those observations. */
  designEvidence?: readonly IAutoMovieDesignEvidence[];

  /**
   * Phase, alternative and change-impact lineage over those same identities.
   */
  designLineages?: readonly IAutoMovieDesignLineage[];

  /** Independent deterministic fluid domains this subject declares. */
  fluidDomains?: readonly IAutoMovieFluidDomain[];

  /** Cloth and cushion domains this subject declares. */
  softBodyDomains?: readonly IAutoMovieSoftBodyDomain[];

  /** Bindings that hang those domains on a building's own elements. */
  softFurnishings?: readonly IAutoMovieSoftFurnishing[];

  /** Growth recipes for the planting this subject declares. */
  plantingDomains?: readonly IAutoMoviePlantingDomain[];

  /** Arrangements those recipes are grown into. */
  plantingClusters?: readonly IAutoMoviePlantingCluster[];

  /** Bindings that plant those clusters in a building's own spaces. */
  plantingInstallations?: readonly IAutoMoviePlantingInstallation[];

  /** Port networks that serve the buildings this subject stages. */
  serviceNetworks?: readonly IAutoMovieServiceNetwork[];

  /** Bindings that make those domains a building's own water features. */
  waterFeatures?: readonly IAutoMovieWaterFeature[];

  /** Source-owned semantic props retained beside their staged placements. */
  props?: readonly IAutoMoviePropSpec[];

  /** Articulated performers this subject stages. */
  actors?: readonly IAutoMovieShotActorProgram[];

  /** Source-computed clips cited by explicit `enact` actions. */
  clips?: readonly IAutoMovieMotion[];

  /** Compact formation-level cues. */
  formationMotions?: readonly IAutoMovieFormationMotion[];

  /** Sparse per-member exceptions inside the formations this subject stages. */
  formationSlotMotions?: readonly IAutoMovieFormationSlotMotion[];

  /** Bounded shot-local deterministic effect cues. */
  effectCues?: readonly IAutoMovieShotEffectCue[];

  /** Named points this subject contributes to the world. */
  landmarks?: readonly IAutoMovieWorldLandmark[];

  /** Queryable surfaces this subject contributes to the world. */
  surfaces?: readonly IAutoMovieWorldSurface[];

  /** Named routes this subject contributes to the world. */
  routes?: readonly IAutoMovieWorldRoute[];

  /** Deterministic effect recipes this subject declares. */
  effectRecipes?: readonly IAutoMovieEffectRecipe[];

  /** Deterministic effect regions this subject occupies. */
  effectZones?: readonly IAutoMovieWorldEffectZone[];

  /** Compact populations this subject materializes. */
  instanceSets?: readonly IAutoMovieInstanceSetDesign[];
}
