/**
 * Readings of one closed planar section, whatever made it: a lofted chain's
 * section in its own plane, or a closed form in a proof. A section is a map
 * from its phase `t` in `[0, 2 pi)` to planar coordinates `[x, z]` in mm,
 * read only through its points, never through the construction's
 * coefficients or derivatives, so a reading measures what a renderer would
 * draw.
 *
 * Each reading is an invariant every section of a lofted part keeps (the
 * section-curve invariants of #3057): it is closed, simple (no
 * self-crossing), star-shaped about its axis, its curvature continuous round
 * the ring, and, for a part lofted from its views, it touches its outline box
 * at the four guides with zero angular slope.
 */
export namespace HumanSectionReading {
  /** Planar point `[x, z]`, mm. */
  export type P2 = [number, number];

  /** A closed section: its point at a phase, radians. */
  export type Curve = (t: number) => P2;

  /** Points of a section at `count` uniform phases from 0. */
  export function sample(curve: Curve, count: number): P2[] {
    return Array.from({ length: count }, (_: unknown, k: number): P2 => curve((2 * Math.PI * k) / count));
  }

  /**
   * Distance between the section's point at phase 0 and at `2 pi`, mm: zero
   * for a closed section, the opening of a section that does not close.
   */
  export function closure(curve: Curve): number {
    const a: P2 = curve(0);
    const b: P2 = curve(2 * Math.PI);
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  }

  /** Perimeter of a closed polygon, mm. */
  export function perimeter(points: readonly P2[]): number {
    let sum: number = 0;
    for (let i: number = 0; i < points.length; i++) {
      const a: P2 = points[i]!;
      const b: P2 = points[(i + 1) % points.length]!;
      sum += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return sum;
  }

  /**
   * Area centroid of a closed polygon, the section's centre when its plane
   * carries no axis of its own (a horizontal layer).
   */
  export function centroid(points: readonly P2[]): P2 {
    let area: number = 0;
    let cx: number = 0;
    let cz: number = 0;
    for (let i: number = 0; i < points.length; i++) {
      const [x0, z0]: P2 = points[i]!;
      const [x1, z1]: P2 = points[(i + 1) % points.length]!;
      const cr: number = x0 * z1 - x1 * z0;
      area += cr / 2;
      cx += ((x0 + x1) * cr) / 6;
      cz += ((z0 + z1) * cr) / 6;
    }
    return [cx / area, cz / area];
  }

  /**
   * Pairs of non-adjacent polygon edges that cross: zero for a simple
   * section. Proper crossings only (each edge's ends strictly on both sides
   * of the other's line), so two edges that merely share a point of a
   * tangential touch do not count; a figure-eight or a loop reads at least
   * one. Quadratic in the point count, which a ring of a few hundred points
   * keeps far below a millisecond.
   */
  export function crossings(points: readonly P2[]): number {
    const n: number = points.length;
    let count: number = 0;
    for (let i: number = 0; i < n; i++) {
      const a: P2 = points[i]!;
      const b: P2 = points[(i + 1) % n]!;
      for (let j: number = i + 2; j < n; j++) {
        // The last edge shares its end with the first.
        if (i === 0 && j === n - 1) continue;
        const c: P2 = points[j]!;
        const d: P2 = points[(j + 1) % n]!;
        const d1: number = orient(a, b, c);
        const d2: number = orient(a, b, d);
        const d3: number = orient(c, d, a);
        const d4: number = orient(c, d, b);
        if (d1 * d2 < 0 && d3 * d4 < 0) count++;
      }
    }
    return count;
  }

  /**
   * Steps of a closed polygon that turn backward round a centre: zero when
   * every ray from the centre meets the section once (star-shaped about it).
   * The polygon's own winding, from its signed area, is the forward sense,
   * so a section wound either way reads zero when it is star-shaped; a lobe
   * hooked behind the centre, a fold or a crossing reads its backward steps.
   */
  export function backward(points: readonly P2[], centre: P2): number {
    let area: number = 0;
    for (let i: number = 0; i < points.length; i++) area += cross(points[i]!, points[(i + 1) % points.length]!);
    const turn: number = Math.sign(area);
    let count: number = 0;
    for (let i: number = 0; i < points.length; i++) {
      const a: P2 = points[i]!;
      const b: P2 = points[(i + 1) % points.length]!;
      if (turn * ((a[0] - centre[0]) * (b[1] - centre[1]) - (b[0] - centre[0]) * (a[1] - centre[1])) <= 0) count++;
    }
    return count;
  }

  /** The worst curvature jump round a section and where it is. */
  export interface IJump {
    /** Lower estimate of the jump, 1/mm: about half the step of curvature at a G1 joint, zero on a C2 section. */
    jump: number;

    /** Phase of the jump, radians. */
    at: number;

    /** Mean point spacing of the finer sampling, mm, which sizes the visible limit. */
    spacing: number;
  }

  /**
   * Curvature continuity round a section by refinement. The Menger curvature
   * (the circle through three consecutive points) at `count` and at
   * `2 count` uniform phases gives the largest difference of neighbouring
   * curvatures, `D(count)` and `D(2 count)`. Where the curvature is
   * continuous, that difference is the curvature's slope times the spacing,
   * so halving the spacing halves it and `2 D(2 count) - D(count)` vanishes to
   * second order. Where the curvature steps by `J` (two arcs meeting with a
   * common tangent, a G1 joint), neighbouring samples straddle the step at
   * every spacing, `D` stays near `J / 2` and the estimate reads about
   * `J / 2`. The phase is where the finer sampling's largest difference lies.
   */
  export function jump(curve: Curve, count: number): IJump {
    const coarse: number = steepest(sample(curve, count)).value;
    const fine: P2[] = sample(curve, 2 * count);
    const s: { value: number; index: number } = steepest(fine);
    return {
      jump: Math.max(0, 2 * s.value - coarse),
      at: (2 * Math.PI * (s.index + 1)) / (2 * count),
      spacing: perimeter(fine) / fine.length,
    };
  }

  /** The angular slope at one guide. */
  export interface ITouch {
    /** Guide direction, radians from the plane's `x` axis about the axis point. */
    guide: number;

    /**
     * Angle between the section's normal where the guide's ray meets it and
     * the ray itself, radians: zero when the section crosses the ray square
     * to it, so its polar radius has zero angular slope there and the section
     * touches the side of its box that the ray meets. NaN when the ray meets
     * no point of the section.
     */
    slope: number;

    /** Distance from the axis point to where the ray meets the section, mm. */
    radius: number;

    /**
     * How far the section reaches past the guide point along the ray, mm:
     * the section's extent from the axis point in the ray's direction less
     * {@link radius}. Zero when the guide point is where the section touches
     * that side of its box; a section whose extreme lies off the guide reads
     * the distance between the box side and the guide point.
     */
    overhang: number;
  }

  /**
   * Angular slope of the section at the four guides, the rays from the axis
   * point along `+x`, `+z`, `-x` and `-z` of the section's plane (the front
   * and side views' outline directions in the part's own frame). Where a
   * guide's ray crosses the sampled polygon, the crossing is refined by
   * bisection on the phase down to `1e-12` radians, and the tangent there is
   * the chord over a phase step of `1e-6` radians, so the slope reads the
   * section's own direction, not the sampling's.
   *
   * @param curve The section.
   * @param axis The part's axis point in the plane.
   * @param count Phases of the coarse search.
   */
  export function touch(curve: Curve, axis: P2, count: number): ITouch[] {
    const out: ITouch[] = [];
    const dense: P2[] = sample(curve, 8 * count);
    for (const guide of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
      const ray: P2 = [Math.cos(guide), Math.sin(guide)];
      const reach: number = Math.max(...dense.map((p: P2): number => (p[0] - axis[0]) * ray[0] + (p[1] - axis[1]) * ray[1]));

      // Signed distance from the guide's line, positive ahead of the axis point.
      const side: (t: number) => number = (t: number): number => {
        const p: P2 = curve(t);
        return cross(ray, [p[0] - axis[0], p[1] - axis[1]]);
      };
      const ahead: (t: number) => boolean = (t: number): boolean => {
        const p: P2 = curve(t);
        return (p[0] - axis[0]) * ray[0] + (p[1] - axis[1]) * ray[1] > 0;
      };
      let found: ITouch = { guide, slope: NaN, radius: NaN, overhang: NaN };
      for (let k: number = 0; k < count; k++) {
        let lo: number = (2 * Math.PI * k) / count;
        let hi: number = (2 * Math.PI * (k + 1)) / count;
        const fl: number = side(lo);
        const fh: number = side(hi);
        if (!(fl * fh <= 0) || !ahead(lo) || !ahead(hi)) continue;
        for (let n: number = 0; n < 60 && hi - lo > 1e-12; n++) {
          const mid: number = (lo + hi) / 2;
          if (side(mid) * fl <= 0) hi = mid;
          else lo = mid;
        }
        const t: number = (lo + hi) / 2;
        const a: P2 = curve(t - 1e-6);
        const b: P2 = curve(t + 1e-6);
        const tangent: P2 = [b[0] - a[0], b[1] - a[1]];
        const length: number = Math.hypot(tangent[0], tangent[1]);
        const p: P2 = curve(t);

        // The normal is square to the ray when the tangent is: the slope is
        // the angle of the tangent's component along the ray.
        const radius: number = Math.hypot(p[0] - axis[0], p[1] - axis[1]);
        found = { guide, slope: Math.asin(Math.min(1, Math.abs(tangent[0] * ray[0] + tangent[1] * ray[1]) / length)), radius, overhang: Math.max(0, reach - radius) };
        break;
      }
      out.push(found);
    }
    return out;
  }

  /** Breadth (extent along `x`) and depth (extent along `z`) of a polygon, mm. */
  export function extents(points: readonly P2[]): P2 {
    let x0: number = Infinity;
    let x1: number = -Infinity;
    let z0: number = Infinity;
    let z1: number = -Infinity;
    for (const [x, z] of points) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      z0 = Math.min(z0, z);
      z1 = Math.max(z1, z);
    }
    return [x1 - x0, z1 - z0];
  }

  /** Twice the signed area of the triangle `a b c`. */
  function orient(a: P2, b: P2, c: P2): number {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  }

  /** Planar cross product. */
  function cross(a: P2, b: P2): number {
    return a[0] * b[1] - a[1] * b[0];
  }

  /** Largest difference of neighbouring Menger curvatures round a closed polygon, and the index of its first point. */
  function steepest(points: readonly P2[]): { value: number; index: number } {
    const n: number = points.length;
    const k: number[] = points.map((_: P2, i: number): number => menger(points[(i - 1 + n) % n]!, points[i]!, points[(i + 1) % n]!));
    let value: number = 0;
    let index: number = 0;
    for (let i: number = 0; i < n; i++) {
      const d: number = Math.abs(k[(i + 1) % n]! - k[i]!);
      if (d > value) {
        value = d;
        index = i;
      }
    }
    return { value, index };
  }

  /** Signed curvature of the circle through three points, 1/mm: `2 cross / (|ab| |bc| |ca|)`. */
  function menger(a: P2, b: P2, c: P2): number {
    const ab: number = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const bc: number = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const ca: number = Math.hypot(a[0] - c[0], a[1] - c[1]);
    const den: number = ab * bc * ca;
    return den > 0 ? (2 * orient(a, b, c)) / den : 0;
  }
}
