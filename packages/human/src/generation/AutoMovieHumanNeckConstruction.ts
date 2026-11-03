import { AutoMovieHumanHorizontalChain } from "../lofting/AutoMovieHumanHorizontalChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanNeckPrior } from "./AutoMovieHumanNeckPrior";

/**
 * The neck generated between the shoulders and the head.
 *
 * The chain holds the neck's short base: its bottom ring spreads onto the
 * trapezius, and its top ring stands where the head starts. A ring is a shared
 * normalized shape scaled to a width and a depth, each following the tape read
 * at its height at its own measured rate: the neck base tape at the bottom, the
 * neck tape at the top.
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
    const logs = (k: number): number => {
      const f: number = k / last;
      return (
        (1 - f) * Math.log(inputs.neckBase / inputs.scale) +
        f * Math.log(inputs.neck / inputs.scale)
      );
    };
    const size = (s: AutoMovieHumanNeckPrior.ISize, k: number): number =>
      inputs.scale *
      Math.exp(s.level[k]! + s.sex[k]! * inputs.sex + s.gain[k]! * logs(k));
    return AutoMovieHumanHorizontalChain.build(
      {
        name: "head",
        order: prior.order,
        samples: prior.samples,
        rule: "sagittal",
      },
      prior.rings.map(
        (
          ring: AutoMovieHumanNeckPrior.IRing,
          k: number,
        ): [number, number, number][] => {
          const width: number = size(prior.width, k);
          const depth: number = size(prior.depth, k);
          const place: number =
            (prior.place.level[k]! + prior.place.sex[k]! * inputs.sex) *
            inputs.scale;
          const level: number = inputs.top + prior.drop[k]! * inputs.scale;
          return Array.from(
            { length: prior.order },
            (_: unknown, j: number): [number, number, number] => {
              const t: number = (2 * Math.PI * j) / prior.order;
              return [
                place + depth * even(ring.x, t),
                level + inputs.scale * even(ring.y, t),
                width * odd(ring.z, t),
              ];
            },
          );
        },
      ),
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
