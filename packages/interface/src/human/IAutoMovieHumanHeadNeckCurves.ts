import type { IAutoMovieViewPart } from "../construction/IAutoMovieViewPart";
import type { IAutoMovieViewSection } from "../construction/IAutoMovieViewSection";
import type { IAutoMovieCurveLengthMeasurement64 } from "../geometry/IAutoMovieCurveLengthMeasurement64";
import type { IAutoMovieHumanHeadNeck } from "./IAutoMovieHumanHeadNeck";

/**
 * Neck radius, origin and base-height declarations with numerical observations
 * kept distinct from certificates. Runtime construction and admission remain
 * with AutoMovieHumanHeadNeckCurves in Human.
 */
export namespace IAutoMovieHumanHeadNeckCurves {
  /**
   * The source declarations and their explicitly limited measurement metadata.
   *
   * One composition owns bounded numeric source arrays and metadata; no
   * prepared callback, global cache or retained body escapes.
   */
  export interface IOutput {
    /**
     * Original radius in the mass's crown-root parameter; only its lower domain
     * is authored here.
     */
    radius: IAutoMovieViewPart.IOutline;

    /**
     * Physical-station origin X, continuing the same adopted affine axis
     * through the lower course.
     */
    centre: IAutoMovieViewPart.IOutline;

    /**
     * Base height in [0,baseClock], with four C2 spans through front, AP
     * quarter-depth side proxies and C7; these are not native section quarters
     * or measured clinical phases.
     */
    height: IAutoMovieViewPart.IOutline;

    /** Whole mass's lower source boundary. */
    bottom: number;

    /** Inclusive constant-template band, in world height. */
    band: readonly [number, number];

    /**
     * Adopted mean-axis plane origin, not a geometric centroid or palpated skin
     * landmark.
     */
    planeOrigin: readonly [number, number, number];

    /** Unit axis normal to that plane, from the retained pose slope. */
    planeNormal: readonly [number, number, number];

    /**
     * Retained circle-equivalent lateral scale; the actual normal section is
     * not assumed circular.
     */
    lateral: number;

    /** Constant horizontal supports, front/left/back/right, calibration mm. */
    extents: readonly [number, number, number, number];

    /**
     * Actual native normal metric at targets 1e-7/5e-8 mm; its difference is
     * not the base GL8 K/2K observation or an error certificate.
     */
    normalMeasured: IAutoMovieCurveLengthMeasurement64;

    /** Retained posterior-skin secant adopted as the normal-band origin's slope. */
    slope: number;

    /**
     * Course parameter's finite domain length; a clock, not an extra anatomical
     * distance.
     */
    baseClock: number;

    /** Chosen positive lower-radius root in the stated family. */
    baseRadius: number;

    /**
     * Actual numerical measurement and K/K2 observation, not an error
     * certificate.
     */
    measured: IAutoMovieCurveLengthMeasurement64;

    /**
     * Actual four-point chord lower bound in calibration mm; fixed is null if
     * lateral landmarks depend on the selected radius. This is no integral or
     * anatomy certificate.
     */
    baseLandmarkPolygon: IOutputBaseLandmarkPolygon;

    /**
     * Registered anterior/C7 datums, calibration mm; the original prior C7
     * remains distinct.
     */
    baseDatums: Pick<
      IInputs["base"],
      "cervicaleOrigin" | "priorCervicaleOrigin"
    >;
  }

  /** The baseLandmarkPolygon object of {@link IOutput}. */
  export type IOutputBaseLandmarkPolygon = {
    /**
     * Four-landmark chord lower bound in millimetres when independent of the
     * selected radius; otherwise null.
     */
    fixed: number | null;
    /**
     * Four-landmark chord lower bound evaluated at the selected radius,
     * millimetres.
     */
    selected: number;
    /** Front-to-back landmark chord contribution, millimetres. */
    frontBack: number;
    /**
     * Four registered landmark points used by the chord lower bound,
     * calibration millimetres.
     */
    points: readonly [number, number, number][];
  };

  /**
   * Inputs in one calibration-mm frame; slope is dimensionless dx/dy.
   *
   * The caller owns the fixed-size scalar/point context; no generated body or
   * asynchronous handle is retained.
   */
  export interface IInputs {
    /**
     * Retained mean, C7 posterior point, circle-equivalent lateral scale and
     * posterior skin secant.
     */
    neck: IAutoMovieHumanHeadNeck;

    /** Public base target/heights and common C7 datum, already scaled once. */
    base: NonNullable<IAutoMovieHumanHeadNeck["base"]>;

    /** Existing internal overlap mean, distinct from the base course. */
    bottom: number;

    /**
     * Actual upper material boundary for the neck-to-head source, calibration
     * mm.
     */
    menton: number;

    /** Existing cranial origin, fixed from the tragion to the crown. */
    cranialCentre: number;

    /** Existing named tragion height. */
    tragion: number;

    /** Crown/pole height and original root-parameter owner. */
    crown: number;

    /**
     * Existing source's evaluation spacing; also retains its internal overlap
     * margin.
     */
    spacing: number;
  }

  /**
   * Available normal original and unresolved lower family inputs, before the
   * independent base constraint is requested.
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

  /**
   * Call-owned elapsed observations; numeric source declarations retain no
   * timing or prepared callback.
   */
  export interface IWork {
    /**
     * Native conic preparation, excluding its separate admission and metric
     * reads.
     */
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

    /**
     * Actual trial-local quadrature queries of height/origin/polar originals,
     * without a cross-radius fixed population.
     */
    baseFixedQueries: number;

    /** Actual original radius scalar reads at those trial-local stations. */
    baseRadiusQueries: number;

    /**
     * Actual native polar quadrature evaluations; the four direct named-point
     * reads are separate.
     */
    baseNativeEvaluations: number;

    /**
     * Exact-theta native reads reused only on unchanged fixed quadrature
     * intervals.
     */
    baseNativeReused: number;

    /**
     * Fixed-phase affine derivative evaluations; zero when trial-dependent
     * phase requires direct original evaluation.
     */
    baseAffineEvaluations: number;
  }
}
