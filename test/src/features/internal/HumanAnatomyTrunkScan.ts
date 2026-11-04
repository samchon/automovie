import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
const A: typeof HumanAnatomy = HumanAnatomy;
const { band, spineX }: typeof HumanAnatomyShared = HumanAnatomyShared;

/**
 * The scanning helpers the trunk, neck and spine observers share: stations
 * along a height, the front and back of a median profile, planar concavity and
 * the flattest plane through a point set. Frame: x forward, y up, z the body's
 * left, millimetres, floor at y = 0.
 */
export namespace HumanAnatomyTrunkScan {
  /** One height of a scan and its reading; NaN where the section is missing. */
  export interface IStation {
    /** Height of the station, mm. */
    y: number;

    /** Reading at that height, in the unit of the scan; NaN when the skin has no section there. */
    v: number;
  }

  /** The height of a scan's least finite reading; NaN when none is finite. */
  export function least(stations: IStation[]): number {
    let y: number = NaN;
    let v: number = Infinity;

    for (const s of stations)
      if (Number.isFinite(s.v) && s.v < v) {
        v = s.v;
        y = s.y;
      }

    return y;
  }

  /**
   * The front (+1) or back (-1) of a median profile at a height: the most
   * anterior crossing in front of the spine line or the most posterior behind
   * it; NaN when the plane holds none.
   *
   * @param lines Section polylines of the median plane.
   * @param y Height of the horizontal line to cross, mm.
   * @param spine The spine line's x at that height, mm, separating front from back.
   * @param sign +1 for the front, -1 for the back.
   */
  export function side(lines: { points: V3[] }[], y: number, spine: number, sign: 1 | -1): number {
    let out: number = NaN;

    for (const l of lines)
      for (let i: number = 0; i + 1 < l.points.length; i++) {
        const a: V3 = l.points[i]!;
        const b: V3 = l.points[i + 1]!;

        // A segment crosses the height when its ends lie on opposite sides.
        if (a[1] >= y === b[1] >= y) continue;

        const x: number = a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]);
        if (sign * (x - spine) <= 0) continue;
        if (Number.isNaN(out) || sign * x > sign * out) out = x;
      }

    return out;
  }

  /**
   * The forward extent (x, mm) of the trunk's front in the sagittal plane at a
   * lateral offset, every 2 mm from one height to another, the arms left out.
   *
   * @param skin Skin to cut.
   * @param z Lateral offset of the plane, mm.
   * @param lo Lowest height, mm.
   * @param hi Highest height, mm.
   */
  export function sagittal(skin: HumanAnatomy.ISkin, z: number, lo: number, hi: number): IStation[] {
    // The arms hang beside the trunk in the standing A-pose and would cut the plane at the sides.
    const arm: boolean[] = skin.chains.map((c: string): boolean => /^(arm|thumb|hand|finger)/.test(c));
    const tris: Uint32Array = band(skin, lo - 10, hi + 10).filter((t: number): boolean => !arm[skin.tri[t]!]);
    const lines: { points: V3[]; closed: boolean }[] = A.polylines(skin, [0, 0, z], [0, 0, 1], tris);
    const out: IStation[] = [];

    for (let y: number = lo; y <= hi; y += 2) out.push({ y, v: side(lines, y, spineX(skin, y), 1) });

    return out;
  }

  /** A section, or an empty one with a NaN girth when the site was not found. */
  export function cutOrEmpty(c: HumanAnatomy.ICut | null): HumanAnatomy.ICut {
    return c ?? { girth: NaN, area: NaN, points: [], contained: false, outside: NaN };
  }

  /**
   * The skin point of a meridian at a station along an axis, interpolated
   * between the meridian's points either side of it; null when the meridian
   * does not reach it.
   *
   * @param curve Ordered meridian points, mm.
   * @param origin Station zero on the axis, mm.
   * @param axis Unit axis direction.
   * @param s Station along the axis, mm.
   */
  export function station(curve: V3[], origin: V3, axis: V3, s: number): V3 | null {
    for (let i: number = 0; i + 1 < curve.length; i++) {
      const a: number = A.dot(A.sub(curve[i]!, origin), axis) - s;
      const b: number = A.dot(A.sub(curve[i + 1]!, origin), axis) - s;

      if (a === 0) return curve[i]!;
      if (a < 0 !== b < 0) return A.lerp(curve[i]!, curve[i + 1]!, a / (a - b));
    }

    return null;
  }

  /**
   * The most concave point of a planar skin curve about an axis: the point
   * lying deepest inside the chord of its neighbours 20 mm of arc either side,
   * inside meaning toward the axis; null when no point lies inside its chord.
   *
   * The 20 mm half-chord is a chosen scale, not a measured one: wider than a
   * fold or a 12 mm ring, which it averages away, and no wider than the run of
   * meridian below the neck's least girth on the reference backs.
   *
   * @param curve Ordered curve points, mm.
   * @param origin A point on the axis, mm.
   * @param axis Unit axis direction.
   */
  export function deepest(curve: V3[], origin: V3, axis: V3): V3 | null {
    // Resampled at 1 mm of arc, so 20 samples are 20 mm either side.
    const line: V3[] = HumanAnatomyShared.resample(curve, 1);
    const depth: (p: V3) => number = (p: V3): number => A.dist(p, A.add(origin, A.scale(axis, A.dot(A.sub(p, origin), axis))));
    let best: number = 0;
    let at: V3 | null = null;

    for (let i: number = 20; i + 20 < line.length; i++) {
      const m: V3 = line[i]!;
      const chord: V3 = A.lerp(line[i - 20]!, line[i + 20]!, 0.5);

      // Positive when the point lies nearer the axis than its chord's midpoint.
      const sag: number = A.dist(m, chord) * (depth(m) < depth(chord) ? 1 : -1);
      if (sag > best) {
        best = sag;
        at = m;
      }
    }

    return at;
  }

  /**
   * Normal of the least-squares plane through centred points: the covariance's
   * eigenvector of least eigenvalue, by inverse iteration (thirty rounds, far
   * past the convergence of a well-separated smallest eigenvalue).
   *
   * @param points Points relative to their centroid, mm.
   */
  export function flattest(points: V3[]): V3 {
    // The covariance matrix of the offsets, summed over the points.
    const c: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (const p of points)
      for (let i: number = 0; i < 3; i++) for (let j: number = 0; j < 3; j++) c[i]![j] = c[i]![j]! + p[i]! * p[j]!;

    const det: (m: number[][]) => number = (m: number[][]): number =>
      m[0]![0]! * (m[1]![1]! * m[2]![2]! - m[1]![2]! * m[2]![1]!) -
      m[0]![1]! * (m[1]![0]! * m[2]![2]! - m[1]![2]! * m[2]![0]!) +
      m[0]![2]! * (m[1]![0]! * m[2]![1]! - m[1]![1]! * m[2]![0]!);
    const d: number = det(c);
    let x: V3 = [0, 1, 0];
    if (d === 0) return x;

    for (let k: number = 0; k < 30; k++) {
      const y: V3 = [0, 0, 0];

      // Cramer's rule for c y = x, then renormalise.
      for (let i: number = 0; i < 3; i++) {
        const m: number[][] = c.map((row: number[]): number[] => [...row]);
        for (let r: number = 0; r < 3; r++) m[r]![i] = x[r]!;
        y[i] = det(m) / d;
      }
      x = A.unit(y);
    }

    return x;
  }
}
