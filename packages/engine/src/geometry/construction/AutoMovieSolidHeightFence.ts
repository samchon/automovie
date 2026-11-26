import type { AutoMovieVector3Tuple as P3 } from "@automovie/interface";

import { bracketedCrossing } from "../../math/bracketedCrossing";
import { AutoMovieIllinois as Illinois } from "./AutoMovieIllinois";
import { AutoMovieSolidVector as Vec } from "./AutoMovieSolidVector";

/**
 * Physical plane intersections with one original analytic boundary. Prepared
 * intervals belong to the declared source sampling and carry exact endpoint
 * identities. A result must resolve in world units before its source tangent
 * can be used by the incident section.
 */
export namespace AutoMovieSolidHeightFence {
  /** An original boundary point and its two actual incident directions. */
  export interface IPoint {
    /** Point in world millimetres. */
    p: P3;

    /** First derivative in the source curve parameter. */
    along: P3;

    /** An inward surface tangent at the same point. */
    inward: P3;
  }

  /** Read actual curve intersections on the observed monotone-height spans. */
  export function prepare(
    name: string,
    steps: number,
    direction: Readonly<P3>,
    read: (t: number) => IPoint,
  ) {
    const axis: P3 = [...direction];
    const samples = Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps;
      const { p, along } = read(t);
      const y = Vec.dot(p, axis);
      const rate = Vec.dot(along, axis);
      if (!Number.isFinite(y) || !Number.isFinite(rate))
        throw new Error(`${name} has no finite projected boundary jet`);
      return { t, y, rate };
    });
    const critical = samples.flatMap(({ t, rate }, i) => {
      const next = samples[i + 1];
      if (rate === 0) return [t];
      if (next === undefined || rate * next.rate >= 0) return [];
      const derivative = (s: number) => Vec.dot(read(s).along, axis);
      const tolerance = 8 * Number.EPSILON;
      const root = Illinois.root(derivative, t, next.t, tolerance, 100);
      // A finite final Illinois sample alone does not locate an extremum.
      // If its residual is unresolved, retain an actual signed bracket down
      // to the admitted parameter's arithmetic spacing.
      return [
        root !== null && Math.abs(derivative(root)) <= tolerance
          ? root
          : closest(name, derivative, t, next.t, rate, next.rate),
      ];
    });
    const bounds = [...new Set([0, ...critical, 1])].map((t) => ({
      t,
      y: Vec.dot(read(t).p, axis),
    }));
    const heights = [...samples.map(({ y }) => y), ...bounds.map(({ y }) => y)];
    const spans = bounds.slice(1).map((last, i) => [bounds[i]!, last] as const);
    const at = (y: number, closed: boolean = false) =>
      spans.flatMap(([first, last]) => {
        const tolerance = 64 * Number.EPSILON * Math.max(1, Math.abs(y));
        const a = first.y - y,
          b = last.y - y;
        const exact = closed
          ? [first, last].find(({ y: p }) => Math.abs(p - y) <= tolerance)
          : undefined;
        if (exact === undefined && a * b >= 0) return [];
        const residual = (s: number) => Vec.dot(read(s).p, axis) - y;
        let t =
          exact?.t ?? Illinois.root(residual, first.t, last.t, tolerance, 100);
        if (t === null && !closed) return [];
        if (t === null || (closed && Math.abs(residual(t)) > tolerance)) {
          t = closest(name, residual, first.t, last.t, a, b);
          if (Math.abs(residual(t)) > tolerance)
            throw new Error(
              `${name} has no numerically resolved point on the requested physical plane`,
            );
        }
        const { p, along, inward } = read(t);
        const rate = Vec.dot(along, axis);
        return [
          {
            name,
            t,
            p,
            along,
            residual: Vec.dot(p, axis) - y,
            tangent:
              rate === 0
                ? null
                : Vec.unit(
                    Vec.scale(
                      Vec.cross(Vec.cross(along, inward), axis),
                      Math.sign(rate),
                    ),
                  ),
          },
        ];
      });
    return { name, critical, heights, at };
  }

  /** Resolve the closest representable endpoint of a genuine sign bracket. */
  function closest(
    name: string,
    f: (t: number) => number,
    low: number,
    high: number,
    a: number,
    b: number,
  ): number {
    const bracket = bracketedCrossing({
      f,
      low,
      high,
      known: { low: a, high: b },
      past: (v) => v > 0 === b > 0,
      tolerance: Number.EPSILON,
    });
    const left = f(bracket.low);
    const right = f(bracket.high);
    if (
      !(
        bracket.high - bracket.low <= Number.EPSILON &&
        Number.isFinite(left) &&
        Number.isFinite(right) &&
        left * right <= 0
      )
    )
      throw new Error(`${name} has no resolved physical projection bracket`);
    return Math.abs(left) < Math.abs(right) ? bracket.low : bracket.high;
  }
}
