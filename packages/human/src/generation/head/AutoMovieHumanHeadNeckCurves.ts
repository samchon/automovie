import {
  AutoMovieIllinois,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
  measureAutoMovieCurveLength64,
} from "@automovie/engine";

import type { IAutoMovieHumanHeadNeck } from "../IAutoMovieHumanHeadNeck";
import { AutoMovieHumanHeadNeckBase } from "./AutoMovieHumanHeadNeckBase";

/**
 * Original lower-head curves for two distinct neck measurements.
 * The retained mean height is an axis-plane centre proxy and the retained
 * posterior skin secant supplies a pose slope, not a measured neck axis.
 * A constant conic-template band closes the axis-normal tape. A separate
 * named-height course lies on the same homothetic native-conic source below it.
 * The adopted affine axis continues below the unchanged normal band. Base
 * front X follows the explicitly closed common radius family, rather than
 * a whole-section maximum relabelled as a midsagittal jugular notch.
 * Neither choice identifies the palpated thyroid point or taut tape contact.
 *
 * @evidence contracts/common.md#principled-implementation Declares original shared-jet radius and physical-station origin curves, then measures their actual composed three-dimensional base derivative through the engine's source-length owner.
 * @evidence contracts/common.md#clear-and-simple-design One radius, one origin and one named-height course supply the actual mass author and both measurement readers; no independent neck skin or floating target tape is constructed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no Human quadrature, fitted cubic, reference measurement, person branch, finite-difference jet or anatomical-site relabelling.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes retained site/pose proxies, the constant template, dependent front point and affine axis from original declarations, numerical observation and unverified final loft/anatomical contact.
 * @evidence contracts/performance.md#efficient-algorithms Normal trials retain their bounded solve. Base selection uses one initial trial, at most128 additional interior samples and64 Illinois steps; every trial measures its own side phase and height partition with bounded engine quadrature, without a convexity or monotonicity assertion.
 * @evidence contracts/performance.md#reuse-equivalent-work Radius knot bases and the common axis precede trials; only identical-radius complete numeric trials are reused. Trial-dependent height, phase and quadrature facts are not reused across radii; the selected measured declaration itself supplies residual admission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All preparations and trial callbacks are call-owned; the result retains only original numeric declarations and small measurement metadata.
 */
export namespace AutoMovieHumanHeadNeckCurves {
  /** Call-owned elapsed observations; numeric source declarations retain no timing or prepared callback. */
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
    normalMeasured: ReturnType<typeof AutoMovieViewSection.measure>;

    /** Retained posterior-skin secant adopted as the normal-band origin's slope. */
    slope: number;

    /** Course parameter's finite domain length; a clock, not an extra anatomical distance. */
    baseClock: number;

    /** Chosen positive lower-radius root in the stated family. */
    baseRadius: number;

    /** Actual numerical measurement and K/K2 observation, not an error certificate. */
    measured: ReturnType<typeof measureAutoMovieCurveLength64>;

    /** Actual four-point chord lower bound in calibration mm; fixed is null if lateral landmarks depend on the selected radius. This is no integral or anatomy certificate. */
    baseLandmarkPolygon: { fixed: number | null; selected: number; frontBack: number; points: readonly [number, number, number][] };

    /** Registered anterior/C7 datums, calibration mm; the original prior C7 remains distinct. */
    baseDatums: Pick<IInputs["base"], "cervicaleOrigin" | "priorCervicaleOrigin">;
  }

  /** Available normal original and unresolved lower family inputs, before the independent base constraint is requested. */
  export interface IDefinition extends Omit<IOutput, "radius" | "centre" | "height" | "baseClock" | "baseRadius" | "measured" | "baseLandmarkPolygon" | "baseDatums"> {
    /** Same resolved generating inputs; no lower radius has been selected. */
    readonly input: IInputs;

    /** Actual admitted native template, reused by the explicit base constraint. */
    readonly template: AutoMovieViewSection.ISection;
  }

  /**
   * Author a generalized-cylinder band and its named-height base course.
   * Constant radius and affine origin hold as functions, through explicit
   * shared jets in their respective root and physical-station parameters.
   * Its scalar radius is affine in the lower radius and the axis is fixed.
   * The side AP-plane inverse, height spans and integral partition depend
   * on that same trial, so the complete world derivative is not declared
   * affine or convex in radius. Only an actually sampled finite continuous
   * opposite-sign bracket selects a branch; exhaustion is not impossibility.
   * C7 must lie inside the constant band so its existing posterior X and
   * public height remain the same point. The final positive radius and
   * computed target residual are admitted separately from K/K2 accuracy.
   *
   * @evidence contracts/common.md#principled-implementation Retains the mean origin X and posterior C7 point, then solves the independent anterior support on the actual conic's normal-plane metric. A circle-equivalent lateral scale is an explicit shape convention, not a circularity claim. The same conic polar source and original lower scale/origin give the base course's full world derivative.
   * @evidence contracts/common.md#clear-and-simple-design Returns the original declarations that the mass must consume, not a sampled replacement or an unrelated measurement curve.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses an incompatible finite band or missing selected root bracket; it never shifts a public height, changes the retained slope or calls a failed branch globally impossible.
   * @evidence contracts/common.md#meaningful-documentation States calibration units, anatomical versus generating assumptions, trial-dependent side/height ownership and numerical measurement limits.
   * @evidence contracts/performance.md#efficient-algorithms Normal trials use the existing native metric quadrature twice. One initial base trial, at most128 additional interior samples and64 Illinois steps each retain four GL8 panels per actual refinement piece plus its doubled observation; no head, loft or figure is rebuilt.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the admitted normal template, invariant prepared centre and original radius knot bases. Each radius owns its actual side inverse, height and partition; an identical complete trial is reused without claiming cross-radius equivalence.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns caller-owned declarations and scalar metadata; no prepared source or callback is retained globally.
   */
  export function of(input: IInputs, work?: IWork): IOutput {
    return close(define(input, work), work);
  }

  /** Prepare only the independently determined normal band; lower-radius closure is a separate request. */
  export function define(input: IInputs, work?: IWork): IDefinition {
    const r: number = input.neck.radius;
    const m: number = input.neck.backSlope;
    const h: number = Math.hypot(1, m);
    const yc: number = input.neck.level;
    const back: number =
      input.neck.x + m * (input.base.cervicaleHeight - yc) - input.neck.back;
    const trials: Map<number, {
      section: AutoMovieViewSection.ISection;
      measured: ReturnType<typeof AutoMovieViewSection.measure>;
    }> = new Map();
    const normal: (
      front: number,
    ) => ReturnType<typeof AutoMovieViewSection.measure> = (
      front: number,
    ): ReturnType<typeof AutoMovieViewSection.measure> => {
      const previous: ReturnType<typeof trials.get> = trials.get(front);
      if (previous !== undefined) return previous.measured;
      const source: AutoMovieViewSection.ISection = section([front, r, back, r], work);
      const started: number = performance.now();
      const measured: ReturnType<typeof AutoMovieViewSection.measure> = normalLength(source, m);
      if (work !== undefined) {
        work.normalMetric += performance.now() - started;
        work.normalTrials++;
      }
      trials.set(front, { section: source, measured });
      return measured;
    };
    if (
      !(
        Number.isFinite(back) &&
        back > 0 &&
        r > 0 &&
        Number.isFinite(r) &&
        Number.isFinite(m)
      )
    )
      throw new Error(
        "Neck mean origin has no positive finite posterior/lateral source support",
      );
    const frontLo: number = back;
    let frontHi: number = 2 * r;
    const normalTarget: number = 2 * Math.PI * r;
    for (
      let i: number = 0;
      normal(frontHi).lengthMm < normalTarget && i < 64;
      i++
    )
      frontHi *= 2;
    if (
      !(
        Number.isFinite(frontHi) &&
        normal(frontLo).lengthMm <= normalTarget &&
        normal(frontHi).lengthMm >= normalTarget
      )
    )
      throw new Error(
        "Neck normal conic has no selected positive anterior-reach bracket",
      );
    const front: number | null = AutoMovieIllinois.root(
      (candidate: number): number => normal(candidate).lengthMm - normalTarget,
      frontLo, frontHi, 128 * Number.EPSILON * normalTarget, 64,
    );
    if (front === null || !Number.isFinite(front))
      throw new Error("Neck normal conic has no selected finite anterior-reach root");
    const extents: [number, number, number, number] = [front, r, back, r];
    const normalMeasured: ReturnType<typeof AutoMovieViewSection.measure> =
      normal(front);
    const template: AutoMovieViewSection.ISection = trials.get(front)!.section;
    const projected: [number, number] = [
      yc - (m * front) / (h * h),
      yc + (m * back) / (h * h),
    ];
    const lower: number = Math.min(...projected);
    const upper: number = Math.max(...projected);
    const first: number = Math.min(
      input.bottom - r,
      input.menton - input.spacing,
      input.base.suprasternaleHeight,
      input.base.sideNeckPointHeight,
      input.base.cervicaleHeight,
    );
    const x0: number = input.neck.x;
    if (
      ![
        r,
        m,
        h,
        yc,
        lower,
        upper,
        x0,
        input.menton,
        input.crown,
      ].every(Number.isFinite) ||
      !(
        r > 0 &&
        lower <= upper &&
        upper < input.menton &&
        upper < input.tragion &&
        input.tragion < input.crown
      )
    )
      throw new Error(
        "Neck normal source has no finite conic band below menton",
      );
    if (
      Math.abs(normalMeasured.lengthMm - normalTarget) >
      128 * Number.EPSILON * Math.max(normalMeasured.lengthMm, normalTarget)
    )
      throw new Error("Neck normal conic computed residual failed admission");

    return {
      input, template, bottom: first, band: [lower, upper],
      planeOrigin: [x0, yc, 0], planeNormal: [m / h, 1 / h, 0],
      lateral: r, extents, normalMeasured, slope: m,
    };
  }

  /** Close the unresolved lower-radius family, preserving refusal without replacing the available normal original. */
  export function close(definition: IDefinition, work?: IWork): IOutput {
    const { input, template, extents, bottom: first, band: [lower, upper] }: IDefinition = definition;
    if (![first, input.base.girth, input.base.suprasternaleHeight,
      input.base.cervicaleHeight, input.base.sideNeckPointHeight].every(Number.isFinite) ||
      !(input.base.girth > 0 && first < lower && input.base.suprasternaleHeight < lower &&
        input.base.cervicaleHeight >= lower && Math.max(input.base.cervicaleHeight, input.base.sideNeckPointHeight) <= upper))
      throw new Error("Neck lower family has no compatible finite band with its unchanged named base heights");
    const baseStarted: number = performance.now();
    const base: ReturnType<typeof AutoMovieHumanHeadNeckBase.create> =
      AutoMovieHumanHeadNeckBase.create(
        input,
        template,
        extents,
        first,
        lower,
        upper,
        work,
      );
    if (work !== undefined) work.baseSolve += performance.now() - baseStarted;
    return {
      ...base,
      baseDatums: { cervicaleOrigin: input.base.cervicaleOrigin, priorCervicaleOrigin: input.base.priorCervicaleOrigin },
      bottom: first,
      band: definition.band,
      planeOrigin: definition.planeOrigin,
      planeNormal: definition.planeNormal,
      lateral: definition.lateral,
      extents,
      normalMeasured: definition.normalMeasured,
      slope: definition.slope,
    };
  }

  /** Prepare the actual native conic, including its shared-curvature ends. */
  function section(
    extents: [number, number, number, number],
    work?: IWork,
  ): AutoMovieViewSection.ISection {
    const started: number = performance.now();
    const rho: number = AutoMovieViewSection.ELLIPSE;
    const value: AutoMovieViewSection.ISection = AutoMovieViewSection.bare(
      { extents },
      [rho, rho, rho, rho],
    );
    const prepared: number = performance.now();
    const fault: string | null = AutoMovieViewSection.fault(value);
    if (work !== undefined) {
      work.normalSection += prepared - started;
      work.normalAdmission += performance.now() - prepared;
    }
    if (fault !== null) throw new Error(`Neck original conic: ${fault}`);
    return value;
  }

  /**
   * Read the unchanged native conic in the exact fixed normal-plane metric.
   * Its original derivative [du/(1+m²), -m*du/(1+m²), dv] has norm
   * hypot(du/hypot(1,m), dv). Two native targets supply a real difference;
   * this is not the former polar GL8 K/2K observation. Numeric refusal throws.
   */
  function normalLength(
    source: AutoMovieViewSection.ISection,
    slope: number,
  ): ReturnType<typeof AutoMovieViewSection.measure> {
    const measured: ReturnType<typeof AutoMovieViewSection.measure> =
      AutoMovieViewSection.measure(source, [1 / Math.hypot(1, slope), 1]);
    if (![measured.lengthMm, measured.differenceMm].every(Number.isFinite))
      throw new Error("Neck normal original-source native metric failed");
    return measured;
  }
}
