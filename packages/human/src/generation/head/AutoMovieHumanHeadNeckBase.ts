import { AutoMovieIllinois, AutoMovieViewOutline } from "@automovie/engine";
import type {
  IAutoMovieHumanHeadNeckBase,
  IAutoMovieHumanHeadNeckBaseTrial,
  IAutoMovieHumanHeadNeckCurves,
  IAutoMovieHumanHeadNeckScalars,
  IAutoMovieViewOutline,
  IAutoMovieViewSection,
} from "@automovie/interface";

import { AutoMovieHumanHeadNeckBaseTrial } from "./AutoMovieHumanHeadNeckBaseTrial";
import { AutoMovieHumanHeadNeckScalars } from "./AutoMovieHumanHeadNeckScalars";

/** Explicit positive-radius selection of one shared named-height neck family. */
export namespace AutoMovieHumanHeadNeckBase {
  /**
   * Each trial owns its actual side phase, height partition and complete
   * original GL8 K/2K integral. This family has no asserted convexity or
   * monotonicity in radius. A bounded interior search selects an observed
   * finite sign bracket; Illinois then retains that bracket. Failure to find
   * one is a search refusal, not a proof that no admissible root exists.
   * The selected numeric declarations must meet the original 128eps residual.
   *
   * @evidence contracts/common.md#principled-implementation Selects a positive original-radius branch using exact scalar-basis reach inequalities, actual full trial integrals and the existing bracketed Illinois owner; no convexity of the changed course is assumed.
   * @evidence contracts/common.md#clear-and-simple-design Scalar definitions, complete trial evaluation and bounded branch selection have separate owners; the output is the selected actual numeric source.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not move public heights/tapes, choose a phase from the tape residual, clamp values, fit samples or replace refusal with a prior source.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes finite search exhaustion, positive native reach, computed residual and named-polygon necessity from anatomical validity or global root absence.
   * @evidence contracts/performance.md#efficient-algorithms One initial trial, at most128 additional interior samples and64 Illinois iterations request bounded engine quadrature; domain inequalities read a fixed number of original scalar values.
   * @evidence contracts/performance.md#reuse-equivalent-work Shares immutable scalar bases/centre and exact-theta native data on unchanged fixed intervals; the bracket keeps its two measured trials and returns the selected trial directly.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A finite diagnostic list reports sampled phases and lengths without retaining trial declarations outside the active bracket.
   */
  export function create(
    input: IAutoMovieHumanHeadNeckCurves.IInputs,
    template: IAutoMovieViewSection.ISection,
    extents: IAutoMovieHumanHeadNeckBase.CreateExtents,
    first: number,
    lower: number,
    upper: number,
    work?: IAutoMovieHumanHeadNeckCurves.IWork,
  ): Pick<
    IAutoMovieHumanHeadNeckCurves.IOutput,
    | "radius"
    | "centre"
    | "height"
    | "baseClock"
    | "baseRadius"
    | "measured"
    | "baseLandmarkPolygon"
  > {
    const family: IAutoMovieHumanHeadNeckScalars.IOutput =
      AutoMovieHumanHeadNeckScalars.create(input, first, lower, upper);
    const target: number = family.clock;
    const named: number[] = [
      input.base.suprasternaleHeight,
      input.base.sideNeckPointHeight,
      input.base.cervicaleHeight,
    ];
    const necessary: number = 2 * (Math.max(...named) - Math.min(...named));
    if (
      !Number.isFinite(necessary) ||
      necessary - target > 128 * Number.EPSILON * Math.max(necessary, target)
    )
      throw new Error(
        "Neck base tape is incompatible with the named-height lower bound: " +
          JSON.stringify({ target, necessary, named }),
      );
    const domain: readonly [number, number] = admissible(
      input,
      family,
      extents,
    );
    const polar: IAutoMovieHumanHeadNeckBaseTrial.IPolar =
      AutoMovieHumanHeadNeckBaseTrial.prepareNative(template, family.clock, work);
    const prior: number = input.neck.radius;
    const start: number =
      prior > domain[0] && prior < domain[1]
        ? prior
        : Number.isFinite(domain[1])
          ? (domain[0] + domain[1]) / 2
          : domain[0] + prior;
    type Trial = readonly [number, IAutoMovieHumanHeadNeckBaseTrial.IOutput];
    const samples: { base: number; phase: number; length: number }[] = [];

    /** Prepare and measure one complete radius-dependent trial. */
    const at: (base: number) => Trial = (base: number): Trial => {
      if (!(Number.isFinite(base) && base > domain[0] && base < domain[1]))
        throw new Error(
          "Neck base trial is outside its open positive native-side domain",
        );
      const trial: IAutoMovieHumanHeadNeckBaseTrial.IOutput =
        AutoMovieHumanHeadNeckBaseTrial.create(
          input,
          family,
          template,
          extents,
          base,
          work,
          polar,
        );
      return [base, trial];
    };
    const observe: (base: number) => Trial = (base: number): Trial => {
      const trial: Trial = at(base);
      samples.push({
        base,
        phase: trial[1].sidePhase,
        length: trial[1].measured.lengthMm,
      });
      return trial;
    };
    const residual: (trial: Trial) => number = (trial: Trial): number =>
      trial[1].measured.lengthMm - target;
    const allowance: number = 128 * Number.EPSILON * target;
    const initial: Trial = observe(start);
    const edges: [Trial, Trial] = [initial, initial];
    let selected: Trial | null =
      Math.abs(residual(initial)) <= allowance ? initial : null;
    let bracket: readonly [Trial, Trial] | null = null;
    for (
      let step: number = 1;
      selected === null && bracket === null && step <= 64;
      step++
    ) {
      const fraction: number = 2 ** -step;
      const candidates: number[] = [
        domain[0] + (start - domain[0]) * fraction,
        Number.isFinite(domain[1])
          ? domain[1] - (domain[1] - start) * fraction
          : start * 2 ** step,
      ];
      for (const [side, candidate] of candidates.entries()) {
        const neighbor: Trial = edges[side]!;
        if (
          !(
            Number.isFinite(candidate) &&
            candidate > domain[0] &&
            candidate < domain[1]
          ) ||
          candidate === neighbor[0]
        )
          continue;
        const trial: Trial = observe(candidate);
        if (Math.abs(residual(trial)) <= allowance) {
          selected = trial;
          break;
        }
        if (Math.sign(residual(neighbor)) !== Math.sign(residual(trial))) {
          bracket = side === 0 ? [trial, neighbor] : [neighbor, trial];
          break;
        }
        edges[side] = trial;
      }
    }
    if (selected === null && bracket !== null)
      selected = AutoMovieIllinois.select(
        at,
        residual,
        [bracket[0][0], bracket[0]],
        [bracket[1][0], bracket[1]],
        allowance,
        64,
      );
    if (selected === null)
      throw new Error(
        "Neck base has no selected sampled finite positive-radius sign bracket: " +
          JSON.stringify({
            target,
            domain,
            samples,
          }),
      );
    const [base, trial]: Trial = selected;
    const admitted: number =
      128 * Number.EPSILON * Math.max(target, trial.measured.lengthMm);
    if (
      !(
        Number.isFinite(trial.measured.lengthMm) &&
        Math.abs(residual(selected)) <= admitted
      )
    )
      throw new Error(
        `Neck base radius/root residual failed admission: radius=${base}, residual=${residual(selected)}, allowance=${admitted}`,
      );
    if (trial.polygon - target > admitted)
      throw new Error(
        "Neck base selected named-point polygon exceeds its unchanged public tape",
      );
    return {
      radius: trial.radius,
      centre: trial.centre,
      height: trial.height,
      baseClock: target,
      baseRadius: base,
      measured: trial.measured,
      baseLandmarkPolygon: {
        fixed: null,
        selected: trial.polygon,
        frontBack:
          2 *
          Math.hypot(
            ...trial.points[0]!.map(
              (value: number, i: number): number =>
                value - trial.points[2]![i]!,
            ),
          ),
        points: trial.points,
      },
    };
  }

  /**
   * Exact scalar-basis inequalities keep the side AP target strictly inside
   * the positive native half. They restrict numerical trial admission, not
   * a tape's value or anatomical validity. Actual native admission still runs.
   */
  function admissible(
    input: IAutoMovieHumanHeadNeckCurves.IInputs,
    family: IAutoMovieHumanHeadNeckScalars.IOutput,
    extents: readonly [number, number, number, number],
  ): readonly [number, number] {
    const r: number = input.neck.radius;
    const axis: IAutoMovieHumanHeadNeckScalars.IAxis =
      AutoMovieHumanHeadNeckScalars.axis(input.neck);
    const front: number = input.base.suprasternaleHeight;
    const back: number = input.base.cervicaleHeight;
    const side: number = input.base.sideNeckPointHeight;
    const t0: number =
      0.75 *
        (axis.point(back)[0] -
          (extents[2] * value(family.constant, back)) / r) +
      0.25 *
        (axis.point(front)[0] +
          (extents[0] * value(family.constant, front)) / r) -
      axis.point(side)[0];
    const t1: number =
      (-0.75 * extents[2] * value(family.basis, back) +
        0.25 * extents[0] * value(family.basis, front)) /
      r;
    const c: number = value(family.constant, side);
    const b: number = value(family.basis, side);
    let lo: number = 0;
    let hi: number = Infinity;
    for (const [constant, coefficient] of [
      [c, b],
      [t0 + (extents[2] * c) / r, t1 + (extents[2] * b) / r],
      [(extents[0] * c) / r - t0, (extents[0] * b) / r - t1],
    ]) {
      if (![constant, coefficient].every(Number.isFinite))
        throw new Error("Neck side domain has nonfinite scalar coefficients");
      if (coefficient! > 0) lo = Math.max(lo, -constant! / coefficient!);
      else if (coefficient! < 0) hi = Math.min(hi, -constant! / coefficient!);
      else if (!(constant! > 0))
        throw new Error("Neck side AP plane has no positive native reach");
    }
    if (!(Number.isFinite(lo) && hi > lo))
      throw new Error("Neck side AP plane has no open positive-radius domain");
    return [lo, hi];
  }
}

/** Read an already prepared original scalar, without a new source or inverse solve. */
function value(
  outline: IAutoMovieViewOutline.IOutline,
  station: number,
): number {
  const result: ReturnType<typeof AutoMovieViewOutline.value> =
    AutoMovieViewOutline.value(outline, station);
  if (typeof result === "string") throw new Error(result);
  return result;
}
