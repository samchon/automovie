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
 * in the order given and drops empty arrays. Its field list is typed as a
 * complete record of these keys, so a field added here fails to compile until
 * the merge names it too.
 *
 * @evidence contracts/common.md#principled-implementation A partial record of optional arrays forms a monoid under per-field concatenation, which is what lets any number of subjects merge in a stable order into one shot without knowing about each other.
 * @evidence contracts/common.md#clear-and-simple-design One flat optional field per kind of shot content, each typed by the interface record the builder already validates, so the shot reads a merged contribution with no subject-specific adapter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The merge's field list is a `Record` over this interface's keys, so a new field cannot be silently dropped; no subject kind gets a field of its own and duplicates pass through to the builder's checks.
 * @evidence contracts/common.md#meaningful-documentation States why each subject returns only its own part, why every field is optional, how a formation contributes compact cues, how the merge concatenates and drops empties, and what each field carries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; merging costs one pass over every contributed element, answered on `mergeAutoMovieSubjectContributions`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A contribution is produced per render call for one shot context and no operation on this type keys or shares it across shots.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Read-only arrays owned by the subject that returned them; their size is whatever the subject authored, with no bound of its own, and the merge copies element references out.
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
