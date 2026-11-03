/**
 * Shape readings of one closed planar section of skin, given as its points in
 * the section's own plane: the concave sagitta across a chord centred on each
 * point (a dent or a crease) and the turn per unit length times the section's
 * own radius (a kink or a rib, the same reading the curve audit's `rib` rule
 * takes along a foot). Both are read on the section's arc length, so a
 * section sampled unevenly reads the same as one sampled evenly.
 */
export namespace HumanLimbSectionShape {
  /** A point in the section's plane, mm. */
  export type Vec2 = readonly [number, number];

  /** The readings at each point of a section. */
  export interface IShape {
    /** Concave sagitta at each point across a chord of the given length, mm; 0 where the skin bends outward. */
    dent: number[];

    /** Turn of the tangent per mm at each point, over the given arc, times the section's radius; 1 on a circle. */
    bend: number[];

    /** The section's perimeter over 2 pi, mm. */
    radius: number;
  }

  /**
   * Readings of a closed section.
   *
   * @param ring The section's points in order round it, at least three.
   * @param chord Length of the chord a dent is read across, mm.
   * @param arc Arc length either side of a point a bend is read over, mm.
   */
  export function of(ring: readonly Vec2[], chord: number, arc: number): IShape {
    const n: number = ring.length;
    const lengths: number[] = [0];
    for (let i: number = 1; i <= n; i++) lengths.push(lengths[i - 1]! + distance(ring[i - 1]!, ring[i % n]!));
    const perimeter: number = lengths[n]!;

    // The ring's sense: positive signed area runs counter-clockwise, so the
    // outside lies to the right of the direction of travel.
    let area: number = 0;
    for (let i: number = 0; i < n; i++) area += ring[i]![0] * ring[(i + 1) % n]![1] - ring[(i + 1) % n]![0] * ring[i]![1];
    const sense: number = area >= 0 ? 1 : -1;

    // A point at an arc length from the ring's start, by linear interpolation
    // between its samples, wrapping round the closed ring.
    const at: (s: number) => Vec2 = (s: number): Vec2 => {
      const t: number = ((s % perimeter) + perimeter) % perimeter;
      let lo: number = 0;
      let hi: number = n;
      while (hi - lo > 1) {
        const m: number = (lo + hi) >> 1;
        if (lengths[m]! <= t) lo = m;
        else hi = m;
      }
      const span: number = lengths[lo + 1]! - lengths[lo]!;
      const w: number = span > 0 ? (t - lengths[lo]!) / span : 0;
      const a: Vec2 = ring[lo]!;
      const b: Vec2 = ring[(lo + 1) % n]!;
      return [a[0] + w * (b[0] - a[0]), a[1] + w * (b[1] - a[1])];
    };

    const dent: number[] = [];
    const bend: number[] = [];
    for (let i: number = 0; i < n; i++) {
      const p: Vec2 = ring[i]!;

      // The sagitta of the point over the chord through the points half a
      // chord's arc either side; positive inside the ring (a concavity).
      const a: Vec2 = at(lengths[i]! - chord / 2);
      const b: Vec2 = at(lengths[i]! + chord / 2);
      const d: Vec2 = [b[0] - a[0], b[1] - a[1]];
      const len: number = Math.hypot(d[0], d[1]);
      const side: number = len > 0 ? (d[0] * (p[1] - a[1]) - d[1] * (p[0] - a[0])) / len : 0;
      dent.push(Math.max(0, -sense * side));

      // The tangent's turn between the chords arriving at and leaving the point
      // over the given arc, per mm of that arc, times the section's radius.
      const u: Vec2 = at(lengths[i]! - arc);
      const v: Vec2 = at(lengths[i]! + arc);
      const t1: Vec2 = [p[0] - u[0], p[1] - u[1]];
      const t2: Vec2 = [v[0] - p[0], v[1] - p[1]];
      const turn: number = Math.abs(Math.atan2(t1[0] * t2[1] - t1[1] * t2[0], t1[0] * t2[0] + t1[1] * t2[1]));
      bend.push((turn / arc) * (perimeter / (2 * Math.PI)));
    }
    return { dent, bend, radius: perimeter / (2 * Math.PI) };
  }
}

/** Distance between two plane points. */
function distance(a: HumanLimbSectionShape.Vec2, b: HumanLimbSectionShape.Vec2): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}
