import { AutoMovieNaturalSpline } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanArmPrior,
  IAutoMovieHumanHandStar,
  IAutoMovieHumanHandStarField,
  IAutoMovieNaturalCubicSpline,
} from "@automovie/interface";

import { AutoMovieHumanMonotoneCubic } from "../../lofting/AutoMovieHumanMonotoneCubic";
import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";

const { smoother }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;

/**
 * The hand's skin as radii about inner points along the hand: the star fields
 * of the heel and palm (harmonics of the skin's radius, in the section's own
 * half extents), the web valleys drawn into the palm, and the knuckle line the
 * finger roots follow.
 */
export namespace AutoMovieHumanHandStar {
  /** Compile a star. */
  export function star(
    field: IAutoMovieHumanArmPrior.IStar,
  ): IAutoMovieHumanHandStarField {
    const count: number = field.series[0]!.length;
    return {
      stations: field.stations,
      splines: Array.from(
        { length: count },
        (_: unknown, k: number): IAutoMovieNaturalCubicSpline =>
          AutoMovieNaturalSpline.create(
            field.stations,
            field.series.map((row: readonly number[]): number => row[k]!),
          ),
      ),
    };
  }

  /** A star's `[b, c]` at a station and polar angle, held past its ends. */
  export function starPoint(
    field: IAutoMovieHumanHandStarField,
    a: number,
    theta: number,
  ): IAutoMovieHumanHandStar.StarPointResult {
    const held: number = Math.min(
      field.stations[field.stations.length - 1]!,
      Math.max(field.stations[0]!, a),
    );
    const v: number[] = field.splines.map(
      (s: IAutoMovieNaturalCubicSpline): number =>
        AutoMovieNaturalSpline.evaluate(s, held),
    );
    let r: number = v[4]!;
    for (let k: number = 1; 4 + 2 * k < v.length; k++)
      r +=
        v[3 + 2 * k]! * Math.cos(k * theta) +
        v[4 + 2 * k]! * Math.sin(k * theta);
    return [
      v[0]! + v[2]! * r * Math.cos(theta),
      v[1]! + v[3]! * r * Math.sin(theta),
    ];
  }

  /** Skin drawn in toward a web through the hand, in a valley that deepens up to it. */
  function webbed(
    p: [number, number],
    a: number,
    web: IAutoMovieHumanArmPrior.IWeb,
  ): [number, number] {
    const g: number =
      web.depth *
      Math.exp(-0.5 * ((p[0] - web.b) / web.width) ** 2) *
      smoother((a - web.a + web.reach) / web.reach);
    return [p[0], web.c + (p[1] - web.c) * (1 - g)];
  }

  /** Heel skin at a station and angle. */
  export function wholeSkin(
    field: IAutoMovieHumanHandStarField,
    a: number,
    theta: number,
  ): AutoMovieVector3Tuple {
    const [b, c] = starPoint(field, a, theta);
    return [a, b, c];
  }

  /** Palm skin at a station and angle, with the valleys between the knuckles. */
  export function palmSkin(
    field: IAutoMovieHumanHandStarField,
    a: number,
    theta: number,
  ): AutoMovieVector3Tuple {
    let p: [number, number] = starPoint(field, a, theta);
    for (const web of AutoMovieHumanArmPrior.PRIOR.hand.webs)
      p = webbed(p, a, web);
    return [a, p[0], p[1]];
  }

  /** The finger roots' curve: its station at each place across the hand. */
  export function knuckle(b: number): number {
    const prior: IAutoMovieHumanArmPrior.IHandPrior =
      AutoMovieHumanArmPrior.PRIOR.hand;
    return AutoMovieHumanMonotoneCubic.interpolate(
      [
        [prior.ends[0]![0]!, prior.ends[0]![1]!],
        [prior.ends[1]![0]!, prior.ends[1]![1]!],
        ...prior.webs.map(
          (w: IAutoMovieHumanArmPrior.IWeb): [number, number] => [w.b, w.a],
        ),
      ],
      b,
    );
  }

  /** Palm skin on the family from the thumb's branch (0) to the finger roots (1). */
  export function palmPoint(
    field: IAutoMovieHumanHandStarField,
    u: number,
    theta: number,
  ): AutoMovieVector3Tuple {
    const from: number = AutoMovieHumanArmPrior.PRIOR.hand.branch;
    let a: number = from + u * (knuckle(0) - from);
    for (let i: number = 0; i < 3; i++)
      a = from + u * (knuckle(starPoint(field, a, theta)[0]) - from);
    return palmSkin(field, a, theta);
  }
}
