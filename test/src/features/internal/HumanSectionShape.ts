import type { HumanReferenceSections } from "./HumanReferenceSections";

type V3 = HumanReferenceSections.V3;

/**
 * Shape readings of one horizontal section for the estimate readings: its
 * extremes and each quarter's conic shoulder, in the section's plane (x
 * forward, z the body's left).
 */
export namespace HumanSectionShape {
  /** A section's extremes and quarter shoulders. */
  export interface IShape {
    /** Most anterior x, mm. */
    front: number;

    /** Most posterior x, mm. */
    back: number;

    /** Greatest z (left), mm. */
    left: number;

    /** Least z (right), mm. */
    right: number;

    /**
     * Each quarter's conic shoulder: with the quarter's origin at the lateral
     * extreme's x and the front (or back) extreme's z, and its touch points
     * (a, 0) and (0, b), the greatest `x / a + z / b - 1` over the quarter's
     * points, 0 for the chord between the touch points and 1 for the box's
     * corner. Front and back average the two sides (the right reflected).
     */
    shoulder: { front: number; back: number };
  }

  /**
   * Read a section's points.
   *
   * @param points The section's points, mm.
   * @returns Its shape, or null for fewer than four points.
   */
  export function of(points: V3[]): IShape | null {
    if (points.length < 4) return null;
    const max = (f: (p: V3) => number): V3 => points.reduce((a: V3, b: V3): V3 => (f(b) > f(a) ? b : a));
    const front: V3 = max((p: V3): number => p[0]);
    const back: V3 = max((p: V3): number => -p[0]);
    const left: V3 = max((p: V3): number => p[2]);
    const right: V3 = max((p: V3): number => -p[2]);
    const quarter = (axial: V3, lateral: V3, forward: 1 | -1, side: 1 | -1): number => {
      const ox: number = lateral[0];
      const oz: number = axial[2];
      const a: number = forward * (axial[0] - ox);
      const b: number = side * (lateral[2] - oz);
      if (!(a > 0 && b > 0)) return NaN;
      let best: number = -Infinity;
      for (const p of points) {
        const u: number = (forward * (p[0] - ox)) / a;
        const v: number = (side * (p[2] - oz)) / b;
        if (u >= 0 && v >= 0) best = Math.max(best, u + v - 1);
      }
      return best;
    };
    const mean = (a: number, b: number): number => (Number.isFinite(a) && Number.isFinite(b) ? (a + b) / 2 : Number.isFinite(a) ? a : b);
    return {
      front: front[0],
      back: back[0],
      left: left[2],
      right: right[2],
      shoulder: {
        front: mean(quarter(front, left, 1, 1), quarter(front, right, 1, -1)),
        back: mean(quarter(back, left, -1, 1), quarter(back, right, -1, -1)),
      },
    };
  }

  /**
   * Mean and SD of the finite values, as text.
   *
   * @param values The values.
   * @param digits Decimal places.
   */
  export function stat(values: number[], digits: number): string {
    const v: number[] = values.filter((x: number): boolean => Number.isFinite(x));
    if (v.length === 0) return "none";
    const m: number = v.reduce((a: number, b: number): number => a + b, 0) / v.length;
    const sd: number = Math.sqrt(v.reduce((a: number, b: number): number => a + (b - m) ** 2, 0) / Math.max(1, v.length - 1));
    return `${m.toFixed(digits)} (${sd.toFixed(digits)}) n ${v.length}`;
  }
}
