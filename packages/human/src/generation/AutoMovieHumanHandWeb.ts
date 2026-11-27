import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanHandClear,
  IAutoMovieHumanHandDigit,
  IAutoMovieHumanHandWeb,
} from "@automovie/interface";

import { AutoMovieHumanHandDigitLaw } from "./AutoMovieHumanHandDigitLaw";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";

/**
 * The form's web geometry: each digit's root ring from its arcs of its
 * parent's ring, each web's crest, and the first section of a digit that
 * stands clear of its arcs and crests.
 */
export namespace AutoMovieHumanHandWeb {
  /** A digit's first ring at its web: its arcs of the parent's ring, closed by bridges. */
  export function rootOf(
    order: number,
    arcs: IAutoMovieHumanHandWeb.RootOfArcs,
    read: IAutoMovieHumanHandWeb.RootOfRead,
  ): AutoMovieVector3Tuple[] {
    const span = ([from, to]: [number, number]): number =>
      to >= from ? to - from : to + TWO_PI - from;
    const points: AutoMovieVector3Tuple[] = [];
    arcs.forEach((arc: [number, number], i: number): void => {
      const next: [number, number] = arcs[(i + 1) % arcs.length]!;
      const share: number = Math.max(4, Math.round(order / (2 * arcs.length)));
      for (let j: number = 0; j < share; j++)
        points.push(read(arc[0] + (span(arc) * j) / share));
      const from: AutoMovieVector3Tuple = read(arc[0] + span(arc));
      const to: AutoMovieVector3Tuple = read(next[0]);
      for (let j: number = 0; j < 3; j++) {
        const f: number = j / 3;
        points.push([
          from[0] + f * (to[0] - from[0]),
          from[1] + f * (to[1] - from[1]),
          from[2] + f * (to[2] - from[2]),
        ]);
      }
    });
    return points;
  }

  /**
   * A web's crest in the form, as the surface builds it: a round margin half its
   * pinches' chord past their middle, along the parent's own surface there.
   */
  export function crestOf(
    ring: IAutoMovieHumanHandWeb.CrestOfRing,
    outward: IAutoMovieHumanHandWeb.CrestOfOutward,
    from: number,
    to: number,
  ): IAutoMovieHumanHandClear {
    const A: AutoMovieVector3Tuple = ring(from);
    const B: AutoMovieVector3Tuple = ring(to);
    const xi: AutoMovieVector3Tuple = unit(sub(B, A));
    const mean: AutoMovieVector3Tuple = plus(outward(from), outward(to));
    const ea: AutoMovieVector3Tuple = unit(sub(mean, scale(xi, dot(mean, xi))));
    const rho: number = norm(sub(B, A)) / 2;
    return {
      point: plus(scale(plus(A, B), 0.5), scale(ea, rho)),
      margin: rho + CREST_CLEARANCE,
    };
  }

  /** A child's arcs of its parent's ring, sampled, each to stand behind its first section. */
  export function arcPoints(
    ring: IAutoMovieHumanHandWeb.ArcPointsRing,
    arcs: IAutoMovieHumanHandWeb.ArcPointsArcs,
  ): IAutoMovieHumanHandClear[] {
    return arcs.flatMap(
      ([from, to]: [number, number]): IAutoMovieHumanHandClear[] => {
        const span: number = to >= from ? to - from : to + TWO_PI - from;
        return Array.from(
          { length: ARC_SAMPLES + 1 },
          (_: unknown, i: number): IAutoMovieHumanHandClear => ({
            point: ring(from + (span * i) / ARC_SAMPLES),
            margin: ARC_CLEARANCE,
          }),
        );
      },
    );
  }

  /**
   * The first station of a digit whose section, square to its line, has every
   * point it must clear behind it by that point's margin: its arcs of the
   * parent's ring and its webs' crests, so every column of the web descends.
   */
  export function firstOf(
    d: IAutoMovieHumanHandDigit,
    clear: readonly IAutoMovieHumanHandClear[],
  ): number {
    for (let s: number = 0; s < d.cap - 3; s += 0.05) {
      const c: AutoMovieVector3Tuple = linePoint(d, s);
      const t: AutoMovieVector3Tuple = lineTangent(d, s);
      if (
        clear.every(
          (x: IAutoMovieHumanHandClear): boolean =>
            dot(sub(x.point, c), t) <= -x.margin,
        )
      )
        return s;
    }
    return d.cap - 3;
  }

  /*
   * How far a part's first own section stands past its webs' crests, beyond the margin's radius, mm of the form.
   */
  const CREST_CLEARANCE: number = 2;

  /*
   * How far it stands past every point of its arcs, mm of the form.
   */
  const ARC_CLEARANCE: number = 2;

  /*
   * Samples of each arc read for that clearance.
   */
  const ARC_SAMPLES: number = 32;
}

const {
  sub,
  plus,
  scale,
  dot,
  norm,
  unit,
  TWO_PI,
}: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;

const { linePoint, lineTangent }: typeof AutoMovieHumanHandDigitLaw =
  AutoMovieHumanHandDigitLaw;
