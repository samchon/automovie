import {
  AutoMovieEnginePlanarHull,
  AutoMovieEngineLoftRelief,
  AutoMovieEngineSplineCurve,
} from "@automovie/engine";
import type {
  IAutoMovieHumanTrunkSection,
  IAutoMovieHumanTrunkTapes,
  IAutoMovieLoftRelief,
} from "@automovie/interface";

import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
import { AutoMovieHumanTrunkRing } from "./AutoMovieHumanTrunkRing";

/**
 * The trunk's tapes, each solved on the hull of the section it wraps at its
 * site (generalization.md, Tapes): a tape is the perimeter of the convex
 * hull of the section's horizontal projection, reliefs included, which is
 * what a tape stretched round the body measures, and a site's half width is
 * bisected until that perimeter is the tape.
 */
export namespace AutoMovieHumanTrunkTapes {
  /** Phases a girth samples. */
  export const PHASES: number = 512;

  /** Bisections of a half width. */
  export const STEPS: number = 30;

  /**
   * A section's points in its plane `[x, z]`, the reliefs that reach its
   * height moving them along their axes.
   */
  export function points(
    s: IAutoMovieHumanTrunkSection,
    reliefs: readonly IAutoMovieLoftRelief[],
    count: number = PHASES,
  ): IAutoMovieHumanTrunkTapes.PointsResult {
    const c: number[] = AutoMovieHumanTrunkRing.controls(s);
    return Array.from(
      { length: count },
      (_: unknown, i: number): [number, number] => {
        const t: number = (2 * Math.PI * i) / count;
        const p: [number, number, number, number] =
          AutoMovieEngineSplineCurve.evaluate(
            c,
            AutoMovieHumanTrunkQuadrant.ORDER,
            t,
          );
        let x: number = p[0];
        let z: number = p[1];
        for (const r of reliefs) {
          const d: number = AutoMovieEngineLoftRelief.height(r, s.y, t)[0];
          x += d * r.axis[0];
          z += d * r.axis[2];
        }
        return [x, z];
      },
    );
  }

  /** Hull perimeter of planar points. */
  export function hull(points: IAutoMovieHumanTrunkTapes.HullPoints): number {
    return AutoMovieEnginePlanarHull.perimeter(points, 0, 1);
  }

  /**
   * The half width at which a section's tape reads its input.
   *
   * @param tape The tape, mm.
   * @param girth The tape read at a trial half width.
   * @param guess A half width to start from, mm.
   */
  export function solve(
    tape: number,
    girth: IAutoMovieHumanTrunkTapes.SolveGirth,
    guess: number,
  ): number {
    let low: number = 0.3 * guess;
    let high: number = 2.5 * guess;
    for (let k: number = 0; k < STEPS; k++) {
      const mid: number = (low + high) / 2;
      if (girth(mid) < tape) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  }
}
