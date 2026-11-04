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

    // Every layer is the neck's own ring at its girth: its perimeter is the
    // girth interpolated log-linearly from the neck base tape (ISO 8559-1,
    // through the side-neck points and the cervicale) at the bottom to the
    // neck tape at the top, its shape the layer's own harmonics at the neck's
    // depth over width at its top. The trapezius slope beyond the side-neck
    // point is the shoulder line's (`AutoMovieHumanShoulderLine`), which
    // copies the bottom layer: the prior's lower layers had spread onto it,
    // to a half width of 158 mm on f1 against the base girth's 60.
    const aspect: number = size(prior.depth, last) / size(prior.width, last);
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
          const girth: number = inputs.scale * Math.exp(logs(k));
          const width: number = girth / perimeter(ring, aspect, prior.order);
          const depth: number = aspect * width;
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

/**
 * Perimeter of a ring's normalized shape at unit half width and the given
 * depth over width, the polygon of its points at the ring's controls.
 *
 * @param ring The ring's harmonics.
 * @param aspect Half depth over half width.
 * @param order Points round the ring.
 * @returns Perimeter in half widths.
 */
function perimeter(ring: AutoMovieHumanNeckPrior.IRing, aspect: number, order: number): number {
  let sum: number = 0;
  let last: [number, number] = [aspect * even(ring.x, 0), odd(ring.z, 0)];
  for (let j: number = 1; j <= order; j++) {
    const t: number = (2 * Math.PI * j) / order;
    const p: [number, number] = [aspect * even(ring.x, t), odd(ring.z, t)];
    sum += Math.hypot(p[0] - last[0], p[1] - last[1]);
    last = p;
  }
  return sum;
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
