import { AutoMovieIllinois, AutoMovieViewSection } from "@automovie/engine";
import type {
  IAutoMovieHumanHeadNeckCurves,
  IAutoMovieViewSection,
} from "@automovie/interface";

import { AutoMovieHumanHeadNeckBase } from "./AutoMovieHumanHeadNeckBase";

/**
 * Original lower-head curves for two distinct neck measurements. The normal
 * band borrows the generated plane origin and estimated axis orientation from
 * the registered neck source. A constant conic-template band closes the
 * axis-normal tape. A separate named-height course lies on the same homothetic
 * native-conic source below it. The adopted affine axis continues below the
 * unchanged normal band. Base front X follows the explicitly closed common
 * radius family, rather than a whole-section maximum relabelled as a
 * midsagittal jugular notch. Neither choice identifies the palpated thyroid
 * point or taut tape contact.
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
  /**
   * Author a generalized-cylinder band and its named-height base course.
   * Constant radius and affine origin hold as functions, through explicit
   * shared jets in their respective root and physical-station parameters. Its
   * scalar radius is affine in the lower radius and the axis is fixed. The side
   * AP-plane inverse, height spans and integral partition depend on that same
   * trial, so the complete world derivative is not declared affine or convex in
   * radius. Only an actually sampled finite continuous opposite-sign bracket
   * selects a branch; exhaustion is not impossibility. C7 must lie inside the
   * constant band so its existing posterior X and public height remain the same
   * point. The final positive radius and computed target residual are admitted
   * separately from K/K2 accuracy.
   *
   * @evidence contracts/common.md#principled-implementation Retains the mean origin X and posterior C7 point, then solves the independent anterior support on the actual conic's normal-plane metric. A circle-equivalent lateral scale is an explicit shape convention, not a circularity claim. The same conic polar source and original lower scale/origin give the base course's full world derivative.
   * @evidence contracts/common.md#clear-and-simple-design Returns the original declarations that the mass must consume, not a sampled replacement or an unrelated measurement curve.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses an incompatible finite band or missing selected root bracket; it never shifts a public height, changes the retained slope or calls a failed branch globally impossible.
   * @evidence contracts/common.md#meaningful-documentation States calibration units, anatomical versus generating assumptions, trial-dependent side/height ownership and numerical measurement limits.
   * @evidence contracts/performance.md#efficient-algorithms Normal trials use the existing native metric quadrature twice. One initial base trial, at most128 additional interior samples and64 Illinois steps each retain four GL8 panels per actual refinement piece plus its doubled observation; no head, loft or figure is rebuilt.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the admitted normal template, invariant prepared centre and original radius knot bases. Each radius owns its actual side inverse, height and partition; an identical complete trial is reused without claiming cross-radius equivalence.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns caller-owned declarations and scalar metadata; no prepared source or callback is retained globally.
   */
  export function of(
    input: IAutoMovieHumanHeadNeckCurves.IInputs,
    work?: IAutoMovieHumanHeadNeckCurves.IWork,
  ): IAutoMovieHumanHeadNeckCurves.IOutput {
    return close(define(input, work), work);
  }

  /**
   * Prepare only the independently determined normal band; lower-radius closure
   * is a separate request.
   */
  export function define(
    input: IAutoMovieHumanHeadNeckCurves.IInputs,
    work?: IAutoMovieHumanHeadNeckCurves.IWork,
  ): IAutoMovieHumanHeadNeckCurves.IDefinition {
    const r: number = input.neck.radius;
    const m: number = input.neck.backSlope;
    const h: number = Math.hypot(1, m);
    const yc: number = input.neck.level;
    const back: number =
      input.neck.x + m * (input.base.cervicaleHeight - yc) - input.neck.back;
    /** An admitted native section and its measured normal-plane tape. */
    type Trial = {
      section: IAutoMovieViewSection.ISection;
      measured: ReturnType<typeof AutoMovieViewSection.measure>;
    };
    const normal = (front: number): Trial => {
      const source: IAutoMovieViewSection.ISection = section(
        [front, r, back, r],
        work,
      );
      const started: number = performance.now();
      const measured: ReturnType<typeof AutoMovieViewSection.measure> =
        normalLength(source, m);
      if (work !== undefined) {
        work.normalMetric += performance.now() - started;
        work.normalTrials++;
      }
      return { section: source, measured };
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
    const normalTarget: number = 2 * Math.PI * r;
    const normalTolerance: number = 128 * Number.EPSILON * normalTarget;
    const low: Trial = normal(frontLo);
    const lowResidual: number = low.measured.lengthMm - normalTarget;
    let front: number = frontLo;
    let selected: Trial = low;
    if (Math.abs(lowResidual) > normalTolerance) {
      let frontHi: number = Math.max(frontLo, 2 * r);
      let highResidual: number =
        normal(frontHi).measured.lengthMm - normalTarget;
      for (let i: number = 0; highResidual < 0 && i < 64; i++) {
        frontHi *= 2;
        highResidual = normal(frontHi).measured.lengthMm - normalTarget;
      }
      if (!(Number.isFinite(frontHi) && lowResidual < 0 && highResidual >= 0))
        throw new Error(
          "Neck normal conic has no selected positive anterior-reach bracket",
        );
      const root: number | null = AutoMovieIllinois.root(
        (candidate: number): number =>
          candidate === frontLo
            ? lowResidual
            : candidate === frontHi
              ? highResidual
              : normal(candidate).measured.lengthMm - normalTarget,
        frontLo,
        frontHi,
        normalTolerance,
        64,
      );
      if (root === null || !Number.isFinite(root))
        throw new Error(
          "Neck normal conic has no selected finite anterior-reach root",
        );
      front = root;
      selected = normal(front);
    }
    const extents: [number, number, number, number] = [front, r, back, r];
    const { measured: normalMeasured, section: template }: Trial = selected;
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
      ![r, m, h, yc, lower, upper, x0, input.menton, input.crown].every(
        Number.isFinite,
      ) ||
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
      input,
      template,
      bottom: first,
      band: [lower, upper],
      planeOrigin: [x0, yc, 0],
      planeNormal: [m / h, 1 / h, 0],
      lateral: r,
      extents,
      normalMeasured,
      slope: m,
    };
  }

  /**
   * Close the unresolved lower-radius family, preserving refusal without
   * replacing the available normal original.
   */
  export function close(
    definition: IAutoMovieHumanHeadNeckCurves.IDefinition,
    work?: IAutoMovieHumanHeadNeckCurves.IWork,
  ): IAutoMovieHumanHeadNeckCurves.IOutput {
    const {
      input,
      template,
      extents,
      bottom: first,
      band: [lower, upper],
    }: IAutoMovieHumanHeadNeckCurves.IDefinition = definition;
    const heightTolerance: number =
      128 * Number.EPSILON * Math.max(1, Math.abs(lower), Math.abs(upper));
    if (
      ![
        first,
        input.base.girth,
        input.base.suprasternaleHeight,
        input.base.cervicaleHeight,
        input.base.sideNeckPointHeight,
      ].every(Number.isFinite) ||
      !(
        input.base.girth > 0 &&
        first < lower &&
        input.base.suprasternaleHeight < lower &&
        input.base.cervicaleHeight >= lower - heightTolerance &&
        Math.max(input.base.cervicaleHeight, input.base.sideNeckPointHeight) <=
          upper + heightTolerance
      )
    )
      throw new Error(
        "Neck lower family has no compatible finite band with its unchanged named base heights",
      );
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
      baseDatums: {
        cervicaleOrigin: input.base.cervicaleOrigin,
        priorCervicaleOrigin: input.base.priorCervicaleOrigin,
      },
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
    work?: IAutoMovieHumanHeadNeckCurves.IWork,
  ): IAutoMovieViewSection.ISection {
    const started: number = performance.now();
    const rho: number = AutoMovieViewSection.ELLIPSE;
    const value: IAutoMovieViewSection.ISection = AutoMovieViewSection.bare(
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
   * Read the unchanged native conic in the exact fixed normal-plane metric. Its
   * original derivative [du/(1+m²), -m*du/(1+m²), dv] has norm
   * hypot(du/hypot(1,m), dv). Two native targets supply a real difference; this
   * is not the former polar GL8 K/2K observation. Numeric refusal throws.
   */
  function normalLength(
    source: IAutoMovieViewSection.ISection,
    slope: number,
  ): ReturnType<typeof AutoMovieViewSection.measure> {
    const measured: ReturnType<typeof AutoMovieViewSection.measure> =
      AutoMovieViewSection.measure(source, [1 / Math.hypot(1, slope), 1]);
    if (![measured.lengthMm, measured.differenceMm].every(Number.isFinite))
      throw new Error("Neck normal original-source native metric failed");
    return measured;
  }
}
