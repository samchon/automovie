import type { IAutoMovieBuiltEnvironment, IAutoMovieDesignEvidence, IAutoMovieDesignLineage, IAutoMovieDesignReference, IAutoMovieEffectRecipe, IAutoMovieFluidDomain, IAutoMovieFormationMotion, IAutoMovieFormationSlotMotion, IAutoMovieInstanceSetDesign, IAutoMovieModel, IAutoMovieMotion, IAutoMoviePlantingCluster, IAutoMoviePlantingDomain, IAutoMoviePlantingInstallation, IAutoMoviePropSpec, IAutoMovieServiceNetwork, IAutoMovieShotActorProgram, IAutoMovieShotEffectCue, IAutoMovieSoftBodyDomain, IAutoMovieSoftFurnishing, IAutoMovieSpace, IAutoMovieStageSetPiece, IAutoMovieWaterFeature, IAutoMovieWorldEffectZone, IAutoMovieWorldLandmark, IAutoMovieWorldRoute, IAutoMovieWorldSurface } from "@automovie/interface";

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
 * @evidence requirements/product/capability-and-content.md#product-project-owned-content Keeps every artifact a project-authored subject owns separate from the shot assembled from many subjects.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Defines the optional plain-data outputs through which a subject hands its authored models, motion, world state, and effects to compilation.
 */
export interface IAutoMovieSubjectContribution {
  /**
   * Source-authored models this subject makes available to the shot.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the exact model records the project chose for this subject instead of substituting an engine catalogue.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Makes source-authored models an explicit subject output available to the shot builder.
   */
  models?: readonly IAutoMovieModel[];
  /**
   * Static visible placements this subject adds to the staged set.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Retains the project's visible set placements as subject-owned content rather than deriving scenery from a subject name.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Exposes static set pieces as explicit output for deterministic shot assembly.
   */
  set?: readonly IAutoMovieStageSetPiece[];
  /**
   * Locomotion spaces this subject contributes for later deterministic merge.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the locomotion spaces authored for this subject without an engine-selected environment preset.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Passes traversable space records explicitly into the merged shot input.
   */
  spaces?: readonly IAutoMovieSpace[];
  /**
   * Structured buildings retained for spatial queries and evidence.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Retains the project's structured building identities and authored facts beside their visible representation.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Makes built-environment records explicit builder input for spatial queries and evidence checks.
   */
  builtEnvironments?: readonly IAutoMovieBuiltEnvironment[];
  /**
   * Observation documents the building source read, carried as provenance.
   *
   * A reading is not a design. These travel beside the building so the builder
   * can hold each one against the bytes it claims to have observed, and they
   * never become geometry on their own.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the project's source observations as provenance without converting those observations into authored geometry.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Carries reference observations beside the building output so compilation can verify the bytes each reference claims to describe.
   */
  designReferences?: readonly IAutoMovieDesignReference[];
  /**
   * Citations from authored design members back to those observations.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the project's citations from authored design members to the observations that justify them.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Exposes member-to-reference evidence as explicit output rather than inferring support from co-location.
   */
  designEvidence?: readonly IAutoMovieDesignEvidence[];
  /**
   * Phase, alternative and change-impact lineage over those same identities.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Retains project-authored phase, alternative, and change-impact lineage over stable design identities.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Passes design lineage as a declared output instead of reconstructing history from the current geometry.
   */
  designLineages?: readonly IAutoMovieDesignLineage[];
  /**
   * Independent deterministic fluid domains this subject declares.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the fluid domains and parameters the project selected for this subject.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Makes independent fluid-domain declarations explicit simulation input.
   */
  fluidDomains?: readonly IAutoMovieFluidDomain[];
  /**
   * Cloth and cushion domains this subject declares.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the cloth and cushion domains authored by the project for this subject.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Supplies soft-body domains as explicit solver input rather than inferring deformation from appearance.
   */
  softBodyDomains?: readonly IAutoMovieSoftBodyDomain[];
  /**
   * Bindings that hang those domains on a building's own elements.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Retains each project-authored binding between a soft domain and its owning building element.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Emits furnishing attachments as explicit relationship records consumed during assembly.
   */
  softFurnishings?: readonly IAutoMovieSoftFurnishing[];
  /**
   * Growth recipes for the planting this subject declares.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the project's chosen planting and growth recipes without supplying a built-in species catalogue.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Carries authored planting-domain rules as explicit inputs to deterministic growth resolution.
   */
  plantingDomains?: readonly IAutoMoviePlantingDomain[];
  /**
   * Arrangements those recipes are grown into.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Retains the arrangements into which the project's planting recipes are grown.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Provides cluster placement and membership as explicit authored output.
   */
  plantingClusters?: readonly IAutoMoviePlantingCluster[];
  /**
   * Bindings that plant those clusters in a building's own spaces.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves project-authored bindings from planting clusters to the building spaces that host them.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Emits planting installation relationships explicitly for building and site assembly.
   */
  plantingInstallations?: readonly IAutoMoviePlantingInstallation[];
  /**
   * Port networks that serve the buildings this subject stages.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Retains the ports and connectivity the project declared for services supporting this subject's buildings.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Supplies service-network topology as explicit output for later validation and staging.
   */
  serviceNetworks?: readonly IAutoMovieServiceNetwork[];
  /**
   * Bindings that make those domains a building's own water features.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the project's bindings between water domains and the building elements they occupy.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Exposes water-feature relationships as authored input to compilation instead of deriving them from geometry.
   */
  waterFeatures?: readonly IAutoMovieWaterFeature[];
  /**
   * Source-owned semantic props retained beside their staged placements.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Retains source-owned prop semantics beside the project's visible prop placements.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Makes semantic prop records explicit builder input rather than inferring meaning from a mesh.
   */
  props?: readonly IAutoMoviePropSpec[];
  /**
   * Articulated performers this subject stages.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the articulated performers the project selected and programmed for this subject.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Hands actor programs to shot compilation as explicit subject output.
   */
  actors?: readonly IAutoMovieShotActorProgram[];
  /**
   * Source-computed clips cited by explicit `enact` actions.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves source-computed motions chosen by the project instead of replacing them with named engine actions.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Exposes motion clips as explicit output that actor `enact` actions can reference by identity.
   */
  clips?: readonly IAutoMovieMotion[];
  /**
   * Compact formation-level cues.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Retains the project's compact group-motion cues without expanding them into authored per-member nodes.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Supplies formation-level motion as an explicit compact input to deterministic expansion.
   */
  formationMotions?: readonly IAutoMovieFormationMotion[];
  /**
   * Sparse per-member exceptions inside the formations this subject stages.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves project-authored motion exceptions for identified formation slots without duplicating the whole population.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Carries sparse member overrides separately from the group-motion input they refine.
   */
  formationSlotMotions?: readonly IAutoMovieFormationSlotMotion[];
  /**
   * Bounded shot-local deterministic effect cues.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Retains the bounded shot-local effect cues the project authored for this subject.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Passes effect timing and parameters explicitly into shot assembly.
   */
  effectCues?: readonly IAutoMovieShotEffectCue[];
  /**
   * Named points this subject contributes to the world.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the named world points and identities the project assigned to this subject.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Exposes landmarks as explicit spatial output for routing, framing, and validation.
   */
  landmarks?: readonly IAutoMovieWorldLandmark[];
  /**
   * Queryable surfaces this subject contributes to the world.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the queryable terrain and support surfaces authored as part of this subject.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Supplies surface footprints, height rules, and traversal state as explicit world input.
   */
  surfaces?: readonly IAutoMovieWorldSurface[];
  /**
   * Named routes this subject contributes to the world.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Retains the named routes and waypoints the project chose for this subject's world contribution.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Makes route geometry and formation clearance explicit output for downstream traversal checks.
   */
  routes?: readonly IAutoMovieWorldRoute[];
  /**
   * Deterministic effect recipes this subject declares.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the deterministic effect recipes authored by the project for this subject.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Makes reusable effect rules explicit input instead of embedding them inside shot execution.
   */
  effectRecipes?: readonly IAutoMovieEffectRecipe[];
  /**
   * Deterministic effect regions this subject occupies.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Retains the project-authored world regions in which this subject's deterministic effects apply.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Passes effect extent and identity as explicit spatial input to compilation.
   */
  effectZones?: readonly IAutoMovieWorldEffectZone[];
  /**
   * Compact populations this subject materializes.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves compact project-authored populations without replacing them with engine-supplied catalogue entries.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Supplies prototype, layout, variation, count, and seed as explicit instance-set output.
   */
  instanceSets?: readonly IAutoMovieInstanceSetDesign[];
}
