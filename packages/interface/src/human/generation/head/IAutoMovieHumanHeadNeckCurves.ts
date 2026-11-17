import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieViewSection } from "../../../construction/IAutoMovieViewSection";
import type { IAutoMovieCurveLengthMeasurement64 } from "../../../geometry/curve/IAutoMovieCurveLengthMeasurement64";
import type { IAutoMovieHumanHeadNeck } from "../IAutoMovieHumanHeadNeck";

/** Type contracts exchanged by AutoMovieHumanHeadNeckCurves; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadNeckCurves {
  /**
   * The source declarations and their explicitly limited measurement metadata.
   *
   * @evidence contracts/common.md#principled-implementation Publishes the actual radius/origin/height sources separately from their numeric solve and quadrature observations.
   * @evidence contracts/common.md#clear-and-simple-design The mass and independent observer share explicit declarations rather than a hidden registry or second neck skin.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Measurements are not certificates or anatomical-site identities; no failed source is replaced by a successful fallback.
   * @evidence contracts/common.md#meaningful-documentation Fields distinguish world heights, physical source parameter, lateral scale, extents, pose slope and numerical observation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This output record performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This output record coordinates no requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One composition owns bounded numeric source arrays and metadata; no prepared callback, global cache or retained body escapes.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The source declarations and their explicitly limited measurement metadata.
   * @evidence contracts/development/design.md#principled-representation `radius`: Original radius in the mass's crown-root parameter; only its lower domain is authored here. `centre`: Physical-station origin X, continuing the same adopted affine axis through the lower course. `height`: Base height in [0,baseClock], with four C2 spans through front, AP quarter-depth side proxies and C7; these are not native section quarters or measured clinical phases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadNeckBase.create, AutoMovieHumanHeadNeckCurves.of, AutoMovieHumanHeadNeckCurves.close. Read by AutoMovieHumanNeckBoundary.create. Also types AutoMovieHumanHeadNeckLayout.curves.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `radius`, `centre`, `height`, `bottom`, `band`, `planeOrigin`, `planeNormal`, `lateral`, `extents`, `normalMeasured`, `slope`, `baseClock`, `baseRadius`, `measured`, `baseLandmarkPolygon`, `baseDatums`; callers supply the complete record.
   */
  export interface IOutput {
    /** Original radius in the mass's crown-root parameter; only its lower domain is authored here. */
    radius: IAutoMovieViewPart.IOutline;

    /** Physical-station origin X, continuing the same adopted affine axis through the lower course. */
    centre: IAutoMovieViewPart.IOutline;

    /** Base height in [0,baseClock], with four C2 spans through front, AP quarter-depth side proxies and C7; these are not native section quarters or measured clinical phases. */
    height: IAutoMovieViewPart.IOutline;

    /** Whole mass's lower source boundary. */
    bottom: number;

    /** Inclusive constant-template band, in world height. */
    band: readonly [number, number];

    /** Adopted mean-axis plane origin, not a geometric centroid or palpated skin landmark. */
    planeOrigin: readonly [number, number, number];

    /** Unit axis normal to that plane, from the retained pose slope. */
    planeNormal: readonly [number, number, number];

    /** Retained circle-equivalent lateral scale; the actual normal section is not assumed circular. */
    lateral: number;

    /** Constant horizontal supports, front/left/back/right, calibration mm. */
    extents: readonly [number, number, number, number];

    /** Actual native normal metric at targets 1e-7/5e-8 mm; its difference is not the base GL8 K/2K observation or an error certificate. */
    normalMeasured: IAutoMovieCurveLengthMeasurement64;

    /** Retained posterior-skin secant adopted as the normal-band origin's slope. */
    slope: number;

    /** Course parameter's finite domain length; a clock, not an extra anatomical distance. */
    baseClock: number;

    /** Chosen positive lower-radius root in the stated family. */
    baseRadius: number;

    /** Actual numerical measurement and K/K2 observation, not an error certificate. */
    measured: IAutoMovieCurveLengthMeasurement64;

    /** Actual four-point chord lower bound in calibration mm; fixed is null if lateral landmarks depend on the selected radius. This is no integral or anatomy certificate. */
    baseLandmarkPolygon: {
      /** Four-landmark chord lower bound in millimetres when independent of the selected radius; otherwise null. */
      fixed: number | null;
      /** Four-landmark chord lower bound evaluated at the selected radius, millimetres. */
      selected: number;
      /** Front-to-back landmark chord contribution, millimetres. */
      frontBack: number;
      /** Four registered landmark points used by the chord lower bound, calibration millimetres. */
      points: readonly [number, number, number][];
    };

    /** Registered anterior/C7 datums, calibration mm; the original prior C7 remains distinct. */
    baseDatums: Pick<
      IInputs["base"],
      "cervicaleOrigin" | "priorCervicaleOrigin"
    >;
  }

  /**
   * Inputs in one calibration-mm frame; slope is dimensionless dx/dy.
   *
   * @evidence contracts/common.md#principled-implementation Keeps public base length/heights separate from retained pose/site data and cranial/clinical neighbours.
   * @evidence contracts/common.md#clear-and-simple-design The one owning solve receives explicit scalar context rather than a body, skin or reference model.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no person selector, expected answer or independent source evaluator.
   * @evidence contracts/common.md#meaningful-documentation Each field names its calibration units, ownership and anatomical versus retained meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This input record performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This input record coordinates no work or cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fixed-size scalar/point context; no generated body or asynchronous handle is retained.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Inputs in one calibration-mm frame; slope is dimensionless dx/dy.
   * @evidence contracts/development/design.md#principled-representation `neck`: Retained mean, C7 posterior point, circle-equivalent lateral scale and posterior skin secant. `base`: Public base target/heights and common C7 datum, already scaled once. `bottom`: Existing internal overlap mean, distinct from the base course.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadNeckBase.create, AutoMovieHumanHeadNeckBase.admissible, AutoMovieHumanHeadNeckBaseTrial.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `neck`, `base`, `bottom`, `menton`, `cranialCentre`, `tragion`, `crown`, `spacing`; callers supply the complete record.
   */
  export interface IInputs {
    /** Retained mean, C7 posterior point, circle-equivalent lateral scale and posterior skin secant. */
    neck: IAutoMovieHumanHeadNeck;

    /** Public base target/heights and common C7 datum, already scaled once. */
    base: NonNullable<IAutoMovieHumanHeadNeck["base"]>;

    /** Existing internal overlap mean, distinct from the base course. */
    bottom: number;

    /** Actual upper material boundary for the neck-to-head source, calibration mm. */
    menton: number;

    /** Existing cranial origin, fixed from the tragion to the crown. */
    cranialCentre: number;

    /** Existing named tragion height. */
    tragion: number;

    /** Crown/pole height and original root-parameter owner. */
    crown: number;

    /** Existing source's evaluation spacing; also retains its internal overlap margin. */
    spacing: number;
  }

  /** Available normal original and unresolved lower family inputs, before the independent base constraint is requested.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Available normal original and unresolved lower family inputs, before the independent base constraint is requested.
   * @evidence contracts/development/design.md#principled-representation `input`: Same resolved generating inputs; no lower radius has been selected. `template`: Actual admitted native template, reused by the explicit base constraint.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadNeckCurves.define. Read by AutoMovieHumanHeadNeckCurves.close, AutoMovieHumanTrunkConnection.normal. Also types AutoMovieHumanHeadNeckCurves.{ input, template, extents, bottom: first, band: [lower, upper] }, AutoMovieHumanHeadNeckLayout.definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `input`, `template`; callers supply the complete record.
   */
  export interface IDefinition extends Omit<
    IOutput,
    | "radius"
    | "centre"
    | "height"
    | "baseClock"
    | "baseRadius"
    | "measured"
    | "baseLandmarkPolygon"
    | "baseDatums"
  > {
    /** Same resolved generating inputs; no lower radius has been selected. */
    readonly input: IInputs;

    /** Actual admitted native template, reused by the explicit base constraint. */
    readonly template: IAutoMovieViewSection.ISection;
  }

  /** Call-owned elapsed observations; numeric source declarations retain no timing or prepared callback.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Call-owned elapsed observations; numeric source declarations retain no timing or prepared callback.
   * @evidence contracts/development/design.md#principled-representation `normalSection`: Native conic preparation, excluding its separate admission and metric reads. `normalAdmission`: Unchanged complete native source admission. `normalMetric`: Both unchanged native metric refinements.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadNeckBase.create, AutoMovieHumanHeadNeckBaseTrial.prepareNative, AutoMovieHumanHeadNeckBaseTrial.create. Also types AutoMovieHumanHeadNeckLayout.neckWork, AutoMovieHumanHeadNeckLayout.work.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `normalSection`, `normalAdmission`, `normalMetric`, `normalTrials`, `baseSolve`, `baseMeasurements`, `baseFixedQueries`, `baseRadiusQueries`, `baseNativeEvaluations`, `baseNativeReused`, `baseAffineEvaluations`; callers supply the complete record.
   */
  export interface IWork {
    /** Native conic preparation, excluding its separate admission and metric reads. */
    normalSection: number;

    /** Unchanged complete native source admission. */
    normalAdmission: number;

    /** Both unchanged native metric refinements. */
    normalMetric: number;

    /** Distinct actual anterior-support trials. */
    normalTrials: number;

    /** Complete base declarations, fixed preparation and positive-radius solve. */
    baseSolve: number;

    /** Actual engine base-length requests, including the final residual reading. */
    baseMeasurements: number;

    /** Actual trial-local quadrature queries of height/origin/polar originals, without a cross-radius fixed population. */
    baseFixedQueries: number;

    /** Actual original radius scalar reads at those trial-local stations. */
    baseRadiusQueries: number;

    /** Actual native polar quadrature evaluations; the four direct named-point reads are separate. */
    baseNativeEvaluations: number;

    /** Exact-theta native reads reused only on unchanged fixed quadrature intervals. */
    baseNativeReused: number;

    /** Fixed-phase affine derivative evaluations; zero when trial-dependent phase requires direct original evaluation. */
    baseAffineEvaluations: number;
  }
}
