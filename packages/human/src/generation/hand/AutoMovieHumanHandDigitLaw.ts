import type { IAutoMovieHumanHandDigit } from "./IAutoMovieHumanHandDigit";
import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";
import { AutoMovieHumanNaturalSpline } from "../../lofting/AutoMovieHumanNaturalSpline";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { sub, dot, norm, unit, cross, TWO_PI }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;

/**
 * A digit's law in the hand form's axes: the centre line through its anchors,
 * the width and depth of its sections along it, and the rounded tip's apex,
 * where the radius equals the length left to the apex.
 */
export namespace AutoMovieHumanHandDigitLaw {
  /** A digit's line at a length from its root. */
  export function linePoint(d: IAutoMovieHumanHandDigit, s: number): Vec3 {
    return [
      AutoMovieHumanNaturalSpline.evaluate(d.line[0]!, s),
      AutoMovieHumanNaturalSpline.evaluate(d.line[1]!, s),
      AutoMovieHumanNaturalSpline.evaluate(d.line[2]!, s),
    ];
  }

  /** A digit's unit tangent toward its tip. */
  export function lineTangent(d: IAutoMovieHumanHandDigit, s: number): Vec3 {
    return unit(sub(linePoint(d, s + 0.05), linePoint(d, s - 0.05)));
  }

  /** Axes across a digit's line: toward the thumb's side and through the hand. */
  export function digitAxes(t: Vec3): [Vec3, Vec3] {
    const k: number = t[1];
    const b: Vec3 = unit([-k * t[0], 1 - k * t[1], -k * t[2]]);
    return [b, cross(t, b)];
  }

  /**
   * A digit's law from its anchors and its root.
   *
   * @param root Its first ring at the web, for its centre and the sense its phase
   *   turns.
   */
  export function digit(
    source: AutoMovieHumanArmPrior.IDigit,
    root: Vec3[],
    start: { centre: Vec3; width: number; depth: number } | null = null,
  ): IAutoMovieHumanHandDigit {
    const n: number = source.order;
    const centre: Vec3 =
      start?.centre ??
      ([0, 1, 2].map(
        (c: number): number =>
          root.reduce((s: number, p: Vec3): number => s + p[c]!, 0) / root.length,
      ) as Vec3);
    const sizes: number[] = source.anchors
      .map((r: readonly number[]): number => Math.sqrt(r[3]! * r[4]!))
      .sort((a: number, b: number): number => a - b);
    const middle: number = sizes[sizes.length >> 1]!;
    const kept: (readonly number[])[] = source.anchors
      .filter(
        (r: readonly number[]): boolean =>
          Math.sqrt(r[3]! * r[4]!) >= 0.5 * middle &&
          r[0]! >= centre[0] + source.blend,
      )
      .reverse();
    const points: Vec3[] = [
      centre,
      ...kept.map((r: readonly number[]): Vec3 => [r[0]!, r[1]!, r[2]!]),
    ];
    const lengths: number[] = [0];
    for (let i: number = 1; i < points.length; i++)
      lengths.push(lengths[i - 1]! + norm(sub(points[i]!, points[i - 1]!)));
    const line: AutoMovieHumanNaturalSpline.ISpline[] = [0, 1, 2].map(
      (c: number): AutoMovieHumanNaturalSpline.ISpline =>
        AutoMovieHumanNaturalSpline.create(
          lengths,
          points.map((p: Vec3): number => p[c]!),
        ),
    );
    const tube: IAutoMovieHumanHandDigit = {
      centre,
      line,
      width: [],
      depth: [],
      angles: [],
      first: 0,
      clear: [],
      cap: 0,
      pole: [0, 0, 0],
    };

    // The tip closes where the radius reaches the distance to the apex.
    const size = (s: number, c: number): number => {
      let i: number = 0;
      while (i + 2 < lengths.length && lengths[i + 1]! < s) i++;
      const low: number = i === 0 ? kept[0]![c]! : kept[i - 1]![c]!;
      const high: number = kept[i]![c]!;
      const f: number = (s - lengths[i]!) / (lengths[i + 1]! - lengths[i]!);
      return low + Math.min(1, Math.max(0, f)) * (high - low);
    };
    const last: number = lengths[lengths.length - 1]!;
    const apex: Vec3 = [source.pole[0], source.pole[1], source.pole[2]];
    let cap: number = last;
    for (let s: number = lengths[1]!; s < last; s += 0.25)
      if (Math.sqrt(size(s, 3) * size(s, 4)) >= norm(sub(apex, linePoint(tube, s)))) {
        cap = s;
        break;
      }
    const knots = (c: number): [number, number][] => [
      [
        0,
        start === null ? kept[0]![c]! : c === 3 ? start.width : start.depth,
      ],
      ...lengths
        .slice(1)
        .filter((s: number): boolean => s < cap - 1)
        .map((s: number, i: number): [number, number] => [s, kept[i]![c]!]),
      [cap, size(cap, c)],
    ];
    tube.width = knots(3);
    tube.depth = knots(4);
    tube.cap = cap;
    const tip: Vec3 = lineTangent(tube, cap - 0.05);
    const reach: number = norm(sub(apex, linePoint(tube, cap)));
    const end: Vec3 = linePoint(tube, cap);
    tube.pole = [
      end[0] + reach * tip[0],
      end[1] + reach * tip[1],
      end[2] + reach * tip[2],
    ];

    // The section turns the way its parent's ring runs round it, so a ring's
    // phase keeps the sense of the rings it joins.
    const [b, c] = digitAxes(lineTangent(tube, 0.1));
    const plain: [number, number][] = root.map(
      (p: Vec3): [number, number] => {
        const v: Vec3 = sub(p, centre);
        return [dot(v, b), dot(v, c)];
      },
    );
    const area: number = plain.reduce(
      (s: number, p: [number, number], m: number): number => {
        const q: [number, number] = plain[(m + 1) % plain.length]!;
        return s + p[0] * q[1] - q[0] * p[1];
      },
      0,
    );
    const turn: number = area >= 0 ? TWO_PI : -TWO_PI;
    tube.angles = Array.from({ length: n }, (_: unknown, m: number): number => (turn * m) / n);

    return tube;
  }
}
