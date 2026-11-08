import { AutoMovieHumanArmViewCurves } from "../arm/AutoMovieHumanArmViewCurves";
import { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";
import type { AutoMovieHumanTrunkComposedSection } from "./AutoMovieHumanTrunkComposedSection";

/**
 * The scalar machinery of S00's view curves: a datum list becomes one fair
 * outline in the station (the world height, the parameter the engine's view
 * loft reads a pole-less part's outlines in, so the composed source, the
 * loft and the drawn specs are one curve), and the one-dimensional solves
 * that close the view curves on tapes and lengths.
 */
export namespace AutoMovieHumanTrunkViewScalar {
  /** One datum of an outline before the fair solve. */
  export interface IDatum {
    /** Site name. */
    site: string;

    /** World height, mm. */
    y: number;

    /** Fixed value (mm, signed X for the midlines, half-width for lateral; shoulder share for fullness), or null. */
    value: number | null;

    /** Fixed `d value / dy`, or null. */
    slope: number | null;

    /** Fixed `d2 value / dy2` per mm (zero at an inflection), or null / absent for the fair minimum's choice. */
    second?: number | null;

    /** Basis. */
    rule: string;
  }

  /** The fair outline through the datums in the station (`q = y`), its jets per mm. */
  export function scalar(datums: readonly IDatum[]): AutoMovieHumanTrunkComposedSection.IScalar {
    const q: number[] = datums.map((d: IDatum): number => d.y);
    const jets: AutoMovieHumanFairOutline.IJet[] = AutoMovieHumanFairOutline.solve(
      datums.map((d: IDatum): AutoMovieHumanFairOutline.IKnot => ({ q: d.y, value: d.value, slope: d.slope, second: d.second ?? null })),
    );
    return { q, jets, at: (y: number): number => y };
  }

  /**
   * Bisection for the datum value whose midline length equals `target`, the
   * length growing with the value along `sense` (+1: larger value, longer;
   * -1: smaller value, longer) on `[lo, hi]`; the bracket's end is kept with
   * the residual left to the caller's check when the target lies outside.
   */
  export function solveLength(length: (value: number) => number, target: number, lo: number, hi: number, sense: 1 | -1): number {
    let a: number = lo;
    let b: number = hi;
    for (let k: number = 0; k < 60; ++k) {
      const mid: number = (a + b) / 2;
      const longer: boolean = length(mid) > target;
      if (longer === sense > 0) b = mid;
      else a = mid;
    }
    return (a + b) / 2;
  }

  /**
   * A root of `f` by the secant method from two starts, each step limited to
   * `cap` and kept inside `[lo, hi]`; stops when the residual is within
   * `tolerance` or after `limit` evaluations, returning the last iterate and
   * its residual (the caller reports a residual left open).
   */
  export function secant(f: (x: number) => number, x0: number, x1: number, options: { lo: number; hi: number; cap: number; tolerance: number; limit: number }): { x: number; residual: number; evaluations: number } {
    let a: number = x0;
    let fa: number = f(a);
    let b: number = Math.min(options.hi, Math.max(options.lo, x1));
    let fb: number = f(b);
    let evaluations: number = 2;
    while (Math.abs(fb) > options.tolerance && evaluations < options.limit) {
      const slope: number = (fb - fa) / (b - a);
      const step: number = Number.isFinite(slope) && slope !== 0 ? -fb / slope : options.cap * -Math.sign(fb);
      const next: number = Math.min(options.hi, Math.max(options.lo, b + Math.max(-options.cap, Math.min(options.cap, step))));
      if (next === b) break;
      a = b;
      fa = fb;
      b = next;
      fb = f(b);
      ++evaluations;
    }
    return { x: b, residual: fb, evaluations };
  }

  /** The lower pole's height drop: the quarter ellipse of semi-axes `projection` and the drop whose arc is `length` (Ramanujan), by bisection. */
  export function lowerPole(projection: number, length: number): number {
    let lo: number = 1;
    let hi: number = 4 * length;
    for (let k: number = 0; k < 80; ++k) {
      const mid: number = (lo + hi) / 2;
      if (AutoMovieHumanArmViewCurves.ramanujan(projection, mid) / 4 < length) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }
}
