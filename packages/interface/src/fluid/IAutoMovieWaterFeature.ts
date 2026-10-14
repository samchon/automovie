import { AutoMovieWaterFeatureKind } from "./AutoMovieWaterFeatureKind";
import { AutoMovieWaterFeatureMode } from "./AutoMovieWaterFeatureMode";

/**
 * The binding that makes an independent fluid domain a building's water
 * feature.
 *
 * This record, not the fluid domain, is the building-owned half. The domain
 * stays a free-standing computational unit; the feature says that one logical
 * space of a building is the basin the domain fills and which boundaries form
 * its rim. A production world with no building places the same domain by not
 * writing a feature.
 *
 * Nothing here restates geometry. The basin's extent is the architecture's
 * logical space and the lattice's extent is the domain's grid, and the engine
 * checks that the binding resolves rather than trusting a name.
 *
 * The production builder hands `validateWaterFeatures` each building's features
 * together with every fluid domain of the shot, after refusing a feature whose
 * `environment` names no staged building. The validator refuses a blank or
 * repeated id, an unknown `kind` or `mode`, a blank `material`, an
 * `environment` other than the building being validated, a space or rim
 * boundary that does not resolve there, a rim boundary that does not bound the
 * space, a domain that is absent or itself invalid, and lattice cell centres at
 * bed height that fall outside a basin stating a volume (the four corner cells
 * decide a convex basin, every cell any other). A basin that states no volume
 * is not measured.
 *
 * @evidence contracts/common.md#principled-implementation `validateWaterFeatures` resolves the space and rim through id maps of the cited building, re-paths the domain's own `validateFluidDomain` violations, and tests lattice cell centres with `builtEnvironmentContainsPoint`, where corner cells suffice for a convex basin because a rectangle lies inside a convex region exactly when its corners do.
 * @evidence contracts/common.md#clear-and-simple-design The binding holds only ids, a label, a mode and a material, so neither the architecture record nor the fluid domain knows about the other and this record is the single place their agreement is checked.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A basin that states no volume and a domain that already failed its own validation are skipped by the containment test on stated grounds rather than given an invented extent; feature ids are compared only within one building, and when two features bind one domain the render subject takes the owner and material of the one whose id sorts first.
 * @evidence contracts/common.md#meaningful-documentation States which half the building owns, that geometry is never restated, how the builder groups features for the validator, every refusal with the corner-or-every-cell rule, and per member the id scope, the rim conditions, the mode effects and what a `null` material means.
 * @author Samchon
 */
export interface IAutoMovieWaterFeature {
  /**
   * Non-blank feature id, unique among the features bound to the same built
   * environment; `validateWaterFeatures` compares ids only within that group.
   */
  id: string;

  /**
   * Id of the `IAutoMovieBuiltEnvironment` that owns the feature. The
   * production builder refuses one that names no building the shot stages.
   */
  environment: string;

  /** Id of the logical space inside that environment acting as the basin. */
  space: string;

  /**
   * Id of the independent fluid domain filling the basin. Several features may
   * bind one domain; they then read the same solved water.
   */
  domain: string;

  /** Semantic label; it selects nothing in the solver. */
  kind: AutoMovieWaterFeatureKind;

  /**
   * How the feature is evaluated over shot time by `lowerWaterFeature`.
   *
   * - `static`: always the authored step-0 state, for a mirror pool that must
   *   read identically in every frame of a cut.
   * - `flowing`: the simulated state, plus a `flowing` hint the viewer stores
   *   for a ripple shader to scroll along the solved velocity field; no shader
   *   in this repository reads it yet.
   * - `simulated`: the simulated state with no additional surface animation.
   */
  mode: AutoMovieWaterFeatureMode;

  /**
   * Ids of the environment's boundaries forming the rim that retains the water,
   * such as the coping of a basin or the parapet of a roof pool. Each must
   * resolve, appear once, and bound `space`. May be empty for a feature
   * retained by its own bed alone.
   */
  boundaries: string[];

  /**
   * Id of the material the surface is drawn with, or `null` for the renderer's
   * own water.
   *
   * A blank string is refused rather than read as the default, and the
   * production builder refuses a non-null id that does not resolve to exactly
   * one compiled material definition.
   */
  material: string | null;
}
