/**
 * Small, physically named target set for a fictional body before detail.
 *
 * Age, standing stature and body mass provide a person-scale request; named
 * exterior measures constrain silhouette without exposing morph weights or
 * 3D points. Optional paired limb targets apply symmetrically by explicit
 * choice, while the detailed anatomical tree keeps independent left/right
 * values and real imaging observations. Missing measures require a validated
 * population estimate or an unavailable result, never an invented zero.
 * This is not the legacy `IAutoMovieHumanBodySimpleShape` whose `sex` and
 * `muscle` are MPFB appearance coordinates. It is not yet interpreted by the
 * connected-skin builder, and it cannot promise shape from these scalars
 * without a validated population model and component geometry.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleAnatomicalTargets {
  /** Desired chronological age in years, not a skin-wrinkle gain. */
  readonly ageYears: number;
  /** Erect crown-to-floor stature in metres. */
  readonly standingStatureMetres: number;
  /** Whole-body mass in kilograms, not an exterior volume. */
  readonly bodyMassKilograms: number;
  /** Horizontal chest circumference at nipple level, in metres. */
  readonly bustAtNippleLevelMetres?: number;
  /** Horizontal waist circumference at the named lower-rib/iliac-crest level. */
  readonly waistAtRibIliacMidpointMetres?: number;
  /** Horizontal buttock circumference at maximum posterior projection. */
  readonly buttockGirthMetres?: number;
  /** Straight acromion-to-acromion shoulder breadth in metres. */
  readonly biacromialBreadthMetres?: number;
  /** Symmetric target at each acromion–olecranon mid-upper-arm site. */
  readonly pairedMidUpperArmGirthMetres?: number;
  /** Symmetric target at each greater-trochanter–lateral-tibia midpoint. */
  readonly pairedMidThighGirthMetres?: number;
  /** Symmetric target at the largest isolated calf girth on each side. */
  readonly pairedMaximumCalfGirthMetres?: number;
}
