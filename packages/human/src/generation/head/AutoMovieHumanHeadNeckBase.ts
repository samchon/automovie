import { AutoMovieIllinois, AutoMovieViewOutline } from "@automovie/engine";

import { AutoMovieHumanHeadNeckBaseTrial } from "./AutoMovieHumanHeadNeckBaseTrial";
import type { AutoMovieHumanHeadNeckCurves } from "./AutoMovieHumanHeadNeckCurves";
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
   * @evidence contracts/performance.md#reuse-equivalent-work Shares immutable scalar bases/centre and exact-theta native data on unchanged fixed intervals; the trial Map reuses only the identical radius's complete numeric phase/partition result.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The bounded call-local Map retains small numeric declarations and measurements, never quadrature populations, callbacks, meshes or global resources.
   */
  export function create(
    input: AutoMovieHumanHeadNeckCurves.IInputs,
    template: Parameters<typeof AutoMovieHumanHeadNeckBaseTrial.create>[2],
    extents: readonly [number, number, number, number],
    first: number,
    lower: number,
    upper: number,
    work?: AutoMovieHumanHeadNeckCurves.IWork,
  ): Pick<AutoMovieHumanHeadNeckCurves.IOutput,
    "radius" | "centre" | "height" | "baseClock" | "baseRadius" | "measured" | "baseLandmarkPolygon"> {
    const family: AutoMovieHumanHeadNeckScalars.IOutput =
      AutoMovieHumanHeadNeckScalars.create(input, first, lower, upper);
    const target: number = family.clock;
    const polar: AutoMovieHumanHeadNeckBaseTrial.IPolar =
      AutoMovieHumanHeadNeckBaseTrial.prepareNative(template, work);
    const named: number[] = [input.base.suprasternaleHeight,
      input.base.sideNeckPointHeight, input.base.cervicaleHeight];
    const necessary: number = 2 * (Math.max(...named) - Math.min(...named));
    if (!Number.isFinite(necessary) || necessary - target > 128 * Number.EPSILON * Math.max(necessary, target))
      throw new Error("Neck base tape is incompatible with the named-height lower bound: " +
        JSON.stringify({ target, necessary, named }));
    const domain: readonly [number, number] = admissible(input, family, extents);
    const prior: number = input.neck.radius;
    const start: number = prior > domain[0] && prior < domain[1] ? prior :
      Number.isFinite(domain[1]) ? (domain[0] + domain[1]) / 2 : domain[0] + prior;
    const retained: Map<number, AutoMovieHumanHeadNeckBaseTrial.IOutput> = new Map();

    /** Reuse only the identical radius and all its actual dependent declarations. */
    const at: (base: number) => AutoMovieHumanHeadNeckBaseTrial.IOutput = (
      base: number,
    ): AutoMovieHumanHeadNeckBaseTrial.IOutput => {
      if (!(Number.isFinite(base) && base > domain[0] && base < domain[1]))
        throw new Error("Neck base trial is outside its open positive native-side domain");
      const previous: AutoMovieHumanHeadNeckBaseTrial.IOutput | undefined = retained.get(base);
      if (previous !== undefined) return previous;
      const trial: AutoMovieHumanHeadNeckBaseTrial.IOutput =
        AutoMovieHumanHeadNeckBaseTrial.create(input, family, template, extents, base, work, polar);
      retained.set(base, trial);
      return trial;
    };
    const residual: (base: number) => number = (base: number): number => at(base).measured.lengthMm - target;
    const allowance: number = 128 * Number.EPSILON * target;
    let selected: number | null = Math.abs(residual(start)) <= allowance ? start : null;
    let bracket: readonly [number, number] | null = null;
    for (let step: number = 1; selected === null && bracket === null && step <= 64; step++) {
      const fraction: number = 2 ** -step;
      const candidates: number[] = [domain[0] + (start - domain[0]) * fraction,
        Number.isFinite(domain[1]) ? domain[1] - (domain[1] - start) * fraction : start * 2 ** step];
      for (const candidate of candidates) {
        if (!(Number.isFinite(candidate) && candidate > domain[0] && candidate < domain[1]) || retained.has(candidate)) continue;
        if (Math.abs(residual(candidate)) <= allowance) { selected = candidate; break; }
        const radii: number[] = [...retained.keys()].sort((a: number, b: number): number => a - b);
        const index: number = radii.indexOf(candidate);
        for (const other of [radii[index - 1], radii[index + 1]]) {
          if (other !== undefined && Math.sign(residual(other)) !== Math.sign(residual(candidate))) {
            bracket = [Math.min(candidate, other), Math.max(candidate, other)];
            break;
          }
        }
        if (bracket !== null) break;
      }
    }
    if (selected === null && bracket !== null)
      selected = AutoMovieIllinois.root(residual, bracket[0], bracket[1], allowance, 64);
    if (selected === null)
      throw new Error("Neck base has no selected sampled finite positive-radius sign bracket: " +
        JSON.stringify({ target, domain, samples: [...retained].map(([base, trial]: [number, AutoMovieHumanHeadNeckBaseTrial.IOutput]): unknown =>
          ({ base, phase: trial.sidePhase, length: trial.measured.lengthMm })) }));
    const trial: AutoMovieHumanHeadNeckBaseTrial.IOutput = at(selected);
    const admitted: number = 128 * Number.EPSILON * Math.max(target, trial.measured.lengthMm);
    if (!(Number.isFinite(trial.measured.lengthMm) && Math.abs(residual(selected)) <= admitted))
      throw new Error(`Neck base radius/root residual failed admission: radius=${selected}, residual=${residual(selected)}, allowance=${admitted}`);
    if (trial.polygon - target > admitted)
      throw new Error("Neck base selected named-point polygon exceeds its unchanged public tape");
    return { radius: trial.radius, centre: trial.centre, height: trial.height,
      baseClock: target, baseRadius: selected, measured: trial.measured,
      baseLandmarkPolygon: { fixed: null, selected: trial.polygon,
        frontBack: 2 * Math.hypot(...trial.points[0]!.map((value: number, i: number): number => value - trial.points[2]![i]!)),
        points: trial.points } };
  }

  /**
   * Exact scalar-basis inequalities keep the side AP target strictly inside
   * the positive native half. They restrict numerical trial admission, not
   * a tape's value or anatomical validity. Actual native admission still runs.
   */
  function admissible(
    input: AutoMovieHumanHeadNeckCurves.IInputs,
    family: AutoMovieHumanHeadNeckScalars.IOutput,
    extents: readonly [number, number, number, number],
  ): readonly [number, number] {
    const r: number = input.neck.radius;
    const axis: AutoMovieHumanHeadNeckScalars.IAxis = AutoMovieHumanHeadNeckScalars.axis(input.neck);
    const front: number = input.base.suprasternaleHeight;
    const back: number = input.base.cervicaleHeight;
    const side: number = input.base.sideNeckPointHeight;
    const t0: number = 0.75 * (axis.point(back)[0] - extents[2] * value(family.constant, back) / r) +
      0.25 * (axis.point(front)[0] + extents[0] * value(family.constant, front) / r) - axis.point(side)[0];
    const t1: number = (-0.75 * extents[2] * value(family.basis, back) +
      0.25 * extents[0] * value(family.basis, front)) / r;
    const c: number = value(family.constant, side);
    const b: number = value(family.basis, side);
    let lo: number = 0;
    let hi: number = Infinity;
    for (const [constant, coefficient] of [[c, b],
      [t0 + extents[2] * c / r, t1 + extents[2] * b / r],
      [extents[0] * c / r - t0, extents[0] * b / r - t1]]) {
      if (![constant, coefficient].every(Number.isFinite))
        throw new Error("Neck side domain has nonfinite scalar coefficients");
      if (coefficient! > 0) lo = Math.max(lo, -constant! / coefficient!);
      else if (coefficient! < 0) hi = Math.min(hi, -constant! / coefficient!);
      else if (!(constant! > 0)) throw new Error("Neck side AP plane has no positive native reach");
    }
    if (!(Number.isFinite(lo) && hi > lo))
      throw new Error("Neck side AP plane has no open positive-radius domain");
    return [lo, hi];
  }
}

/** Read an already prepared original scalar, without a new source or inverse solve. */
function value(outline: AutoMovieViewOutline.IOutline, station: number): number {
  const result: ReturnType<typeof AutoMovieViewOutline.value> = AutoMovieViewOutline.value(outline, station);
  if (typeof result === "string") throw new Error(result);
  return result;
}
