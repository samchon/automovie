import { AutoMovieHumanHorizontalChain } from "../lofting/AutoMovieHumanHorizontalChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanNeckPrior } from "./AutoMovieHumanNeckPrior";
import { AutoMovieHumanNeckCourse } from "./AutoMovieHumanNeckCourse";

/**
 * The neck generated between the shoulders and the head.
 *
 * The head owns the visible tube above the public neck-base course. This
 * short collar carries that course downward without a second size regression;
 * the shoulder owner supplies its widening below it. The observed collar's
 * sampling density and vertical run remain, while its normalized top shape
 * supplies one aspect and phase correspondence shared by all four rows.
 */
export namespace AutoMovieHumanNeckConstruction {
  /** What a neck reads, in the same millimetres as the calibration. */
  export interface IInputs {
    /** Height of the top ring. */
    top: number;

    /** Neck tape. */
    neck: number;

    /** Neck base tape. */
    neckBase: number;

    /** Masculine-feminine control. */
    sex: number;

    /** Calibration millimetres per world millimetre. */
    scale: number;
  }

  /**
   * The neck's chain.
   *
   * @param inputs Tapes in calibration millimetres.
   * @returns The chain named `head`, whose top the head stands on.
   */
  export function generate(inputs: IInputs): IAutoMovieHumanLoftChain {
    const prior: AutoMovieHumanNeckPrior.IPrior = AutoMovieHumanNeckPrior.PRIOR;
    if (!(inputs.neck > 0) || !(inputs.neckBase > 0))
      throw new Error("A neck needs positive tapes");
    const last: number = prior.rings.length - 1;
    const ring: AutoMovieHumanNeckPrior.IRing = prior.rings[last]!;
    const log: number = Math.log(inputs.neckBase / inputs.scale);
    const size: (s: AutoMovieHumanNeckPrior.ISize) => number = (
      s: AutoMovieHumanNeckPrior.ISize,
    ): number => inputs.scale * Math.exp(s.level[last]! + s.sex[last]! * inputs.sex + s.gain[last]! * log);
    const width: number = size(prior.width);
    const depth: number = size(prior.depth);
    const place: number = (prior.place.level[last]! + prior.place.sex[last]! * inputs.sex) * inputs.scale;
    const phases: number[] = Array.from({ length: prior.order }, (_: unknown, j: number): number => 2 * Math.PI * j / prior.order);
    const origin: [number, number, number] = [place, inputs.top, 0];
    const original: [number, number, number][] = phases.map((t: number): [number, number, number] => [place + depth * even(ring.x, t), inputs.top + inputs.scale * even(ring.y, t), width * odd(ring.z, t)]);

    // Fixed physical cardinal contacts own the whole shared boundary. Its
    // axial geometry is registered before sizing, so closing the tape cannot
    // move the course into a more convenient plane or change its heights.
    const boundary: [number, number, number][] = AutoMovieHumanNeckCourse.register(original, origin);
    const scale: number = AutoMovieHumanNeckCourse.scale(inputs.neckBase, boundary, origin);
    return AutoMovieHumanHorizontalChain.build(
      { name: "head", order: prior.order, samples: prior.samples, rule: "sagittal" },
      prior.drop.map((drop: number): [number, number, number][] => boundary.map((point: [number, number, number]): [number, number, number] => [place + scale * (point[0] - place), point[1] + drop * inputs.scale, scale * point[2]])),
    );
  }
}

/** Sum of cosines from the constant term. */
function even(values: readonly number[], t: number): number {
  return values.reduce(
    (s: number, v: number, k: number): number => s + v * Math.cos(k * t),
    0,
  );
}

/** Sum of sines from the first. */
function odd(values: readonly number[], t: number): number {
  return values.reduce(
    (s: number, v: number, k: number): number => s + v * Math.sin((k + 1) * t),
    0,
  );
}
