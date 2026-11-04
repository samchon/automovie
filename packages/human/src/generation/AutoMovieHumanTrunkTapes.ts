import { AutoMovieSplineCurve, AutoMovieLoftRelief, type IAutoMovieLoftRelief } from "@automovie/engine";
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
    s: AutoMovieHumanTrunkQuadrant.ISection,
    reliefs: readonly IAutoMovieLoftRelief[],
    count: number = PHASES,
  ): [number, number][] {
    const c: number[] = AutoMovieHumanTrunkRing.controls(s);
    return Array.from({ length: count }, (_: unknown, i: number): [number, number] => {
      const t: number = (2 * Math.PI * i) / count;
      const p: [number, number, number, number] = AutoMovieSplineCurve.evaluate(c, AutoMovieHumanTrunkQuadrant.ORDER, t);
      let x: number = p[0];
      let z: number = p[1];
      for (const r of reliefs) {
        const d: number = AutoMovieLoftRelief.height(r, s.y, t)[0];
        x += d * r.axis[0];
        z += d * r.axis[2];
      }
      return [x, z];
    });
  }

  /** Hull perimeter of planar points. */
  export function hull(points: readonly [number, number][]): number {
    const sorted: [number, number][] = [...points].sort((a, b): number => a[0] - b[0] || a[1] - b[1]);
    const cross = (o: [number, number], a: [number, number], b: [number, number]): number =>
      (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half = (list: [number, number][]): [number, number][] => {
      const out: [number, number][] = [];
      for (const p of list) {
        while (out.length >= 2 && cross(out[out.length - 2]!, out[out.length - 1]!, p) <= 0) out.pop();
        out.push(p);
      }
      out.pop();
      return out;
    };
    const ring: [number, number][] = [...half(sorted), ...half([...sorted].reverse())];
    let sum: number = 0;
    for (let i: number = 0; i < ring.length; i++) {
      const a: [number, number] = ring[i]!;
      const b: [number, number] = ring[(i + 1) % ring.length]!;
      sum += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return sum;
  }

  /**
   * The half width at which a section's tape reads its input.
   *
   * @param tape The tape, mm.
   * @param girth The tape read at a trial half width.
   * @param guess A half width to start from, mm.
   */
  export function solve(tape: number, girth: (width: number) => number, guess: number): number {
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
