import { HumanAnatomy } from "./HumanAnatomy";

type V3 = HumanAnatomy.V3;
type V2 = [number, number];

const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * Planar geometry of a section loop: lengths, areas, containment, turning,
 * the signed distance of a point to a loop, and the naming of a place on it.
 * Every function reads positions only; none knows a chain, a layer or a person.
 */
export namespace HumanLayerPolygon {
  /** Turning of a closed polygon resampled at an arclength step. */
  export interface ITurning {
    /** Total absolute turning less the absolute net turning, radians; zero exactly when the loop is convex. */
    excess: number;

    /** Every turn at the resampled points, signed with the loop's own winding (convex positive), radians. */
    turns: number[];

    /** The resampled points the turns stand at. */
    points: V2[];
  }

  /** Signed distance of a point to a closed polygon. */
  export interface IDistance {
    /** Distance to the nearest segment, negative inside, mm. */
    distance: number;

    /** Index of the nearest segment; it runs from this vertex to the next. */
    segment: number;

    /** Position of the nearest point along that segment, 0 to 1. */
    along: number;
  }

  /** A run of consecutive flagged samples of one sign round a closed loop. */
  export interface IRun {
    /** First sample index. */
    from: number;

    /** Last sample index; may be smaller than `from` when the run wraps. */
    to: number;

    /** The flag's sign. */
    sign: number;
  }

  /**
   * Perimeter of a planar polyline.
   *
   * @param q The vertices.
   * @param closed Whether the last vertex joins the first.
   */
  export function perimeter(q: V2[], closed: boolean = true): number {
    let length: number = 0;

    for (let i: number = 0; i + (closed ? 0 : 1) < q.length; i++) {
      const a: V2 = q[i]!;
      const b: V2 = q[(i + 1) % q.length]!;

      length += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }

    return length;
  }

  /** Signed area of a closed planar polygon, positive counter-clockwise. */
  export function area(q: V2[]): number {
    let sum: number = 0;

    for (let i: number = 0; i < q.length; i++) {
      const a: V2 = q[i]!;
      const b: V2 = q[(i + 1) % q.length]!;

      sum += a[0] * b[1] - a[1] * b[0];
    }

    return sum / 2;
  }

  /** Area centroid of a closed planar polygon; its first vertex when the area vanishes. */
  export function centroid(q: V2[]): V2 {
    let twice: number = 0;
    let x: number = 0;
    let y: number = 0;

    for (let i: number = 0; i < q.length; i++) {
      const a: V2 = q[i]!;
      const b: V2 = q[(i + 1) % q.length]!;
      const cross: number = a[0] * b[1] - a[1] * b[0];

      twice += cross;
      x += (a[0] + b[0]) * cross;
      y += (a[1] + b[1]) * cross;
    }

    return Math.abs(twice) < 1e-12 ? q[0]! : [x / (3 * twice), y / (3 * twice)];
  }

  /** Whether a point lies inside a closed polygon, by its winding number. */
  export function inside(q: V2[], p: V2): boolean {
    let winding: number = 0;

    for (let i: number = 0; i < q.length; i++) {
      const a: V2 = q[i]!;
      const b: V2 = q[(i + 1) % q.length]!;
      const side: number = (b[0] - a[0]) * (p[1] - a[1]) - (p[0] - a[0]) * (b[1] - a[1]);

      if (a[1] <= p[1]) {
        if (b[1] > p[1] && side > 0) winding++;
      } else if (b[1] <= p[1] && side < 0) winding--;
    }

    return winding !== 0;
  }

  /**
   * A closed polygon resampled at equal arclength.
   *
   * @param q The vertices.
   * @param count Number of points returned.
   */
  export function resample(q: V2[], count: number): V2[] {
    const total: number = perimeter(q);
    const out: V2[] = [];
    let i: number = 0;
    let at: number = 0;
    let len: number = Math.hypot(q[1 % q.length]![0] - q[0]![0], q[1 % q.length]![1] - q[0]![1]);

    for (let k: number = 0; k < count; k++) {
      const want: number = (total * k) / count;

      while (at + len < want && i < q.length - 1) {
        at += len;
        i++;

        const next: V2 = q[i]!;
        const after: V2 = q[(i + 1) % q.length]!;

        len = Math.hypot(after[0] - next[0], after[1] - next[1]);
      }

      const a: V2 = q[i]!;
      const b: V2 = q[(i + 1) % q.length]!;
      const f: number = len > 0 ? Math.min(1, Math.max(0, (want - at) / len)) : 0;

      out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
    }

    return out;
  }

  /**
   * Turning of a closed polygon resampled at an arclength step.
   *
   * By the exterior-turn theorem a simple closed loop turns by exactly 2 pi in
   * absolute value only when it is convex; every concave turn adds twice its
   * size, so an inward V of angle beta adds 4 beta.
   *
   * @param q The vertices.
   * @param step Arclength between resampled points, mm.
   */
  export function turning(q: V2[], step: number): ITurning {
    const count: number = Math.max(8, Math.round(perimeter(q) / step));
    const points: V2[] = resample(q, count);
    const turns: number[] = [];
    let absolute: number = 0;
    let net: number = 0;

    for (let i: number = 0; i < points.length; i++) {
      const a: V2 = points[(i + points.length - 1) % points.length]!;
      const b: V2 = points[i]!;
      const c: V2 = points[(i + 1) % points.length]!;
      const ux: number = b[0] - a[0];
      const uy: number = b[1] - a[1];
      const vx: number = c[0] - b[0];
      const vy: number = c[1] - b[1];
      const turn: number = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);

      turns.push(turn);
      absolute += Math.abs(turn);
      net += turn;
    }

    // A clockwise loop turns negatively, so its sign flips to make convex positive.
    const sign: number = net < 0 ? -1 : 1;

    return {
      excess: absolute - Math.abs(net),
      turns: turns.map((turn: number): number => sign * turn),
      points,
    };
  }

  /** Perimeter of the convex hull of planar points: the taut tape. */
  export function taut(q: V2[]): number {
    return A.hull(q);
  }

  /**
   * Signed distance of a point to a closed polygon, negative inside.
   *
   * @param q The vertices.
   * @param p The point.
   */
  export function signedDistance(q: V2[], p: V2): IDistance {
    let best: number = Infinity;
    let segment: number = 0;
    let along: number = 0;

    for (let i: number = 0; i < q.length; i++) {
      const a: V2 = q[i]!;
      const b: V2 = q[(i + 1) % q.length]!;
      const ex: number = b[0] - a[0];
      const ey: number = b[1] - a[1];
      const ll: number = ex * ex + ey * ey;
      const f: number = ll === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / ll));
      const d: number = Math.hypot(p[0] - a[0] - f * ex, p[1] - a[1] - f * ey);

      if (d < best) {
        best = d;
        segment = i;
        along = f;
      }
    }

    return { distance: inside(q, p) ? -best : best, segment, along };
  }

  /**
   * Mean distance of sample points to a closed polygon, from at most 48
   * evenly spaced samples; how well a loop follows a ring.
   */
  export function meanDistance(points: V2[], q: V2[]): number {
    const step: number = Math.max(1, Math.floor(points.length / 48));
    let sum: number = 0;
    let count: number = 0;

    for (let i: number = 0; i < points.length; i += step) {
      sum += Math.abs(signedDistance(q, points[i]!).distance);
      count++;
    }

    return sum / count;
  }

  /** Index of the smallest value. */
  export function argmin(values: number[]): number {
    let best: number = 0;

    for (let i: number = 1; i < values.length; i++) if (values[i]! < values[best]!) best = i;

    return best;
  }

  /** A closed polygon wound counter-clockwise. */
  export function orient(q: V2[]): V2[] {
    return area(q) < 0 ? [...q].reverse() : q;
  }

  /**
   * Runs of consecutive flagged samples of one sign round a closed loop.
   *
   * A run that crosses the end of the array wraps, so a defect astride the
   * loop's start is one run.
   *
   * @param flags One sign per sample: 0 unflagged, otherwise the finding's direction.
   */
  export function runs(flags: Int8Array): IRun[] {
    const n: number = flags.length;

    if (n === 0) return [];

    let start: number = -1;

    for (let i: number = 0; i < n; i++)
      if (flags[i] !== flags[(i + n - 1) % n]) {
        start = i;
        break;
      }

    if (start < 0) return flags[0] === 0 ? [] : [{ from: 0, to: n - 1, sign: flags[0]! }];

    const out: IRun[] = [];
    let i: number = 0;

    while (i < n) {
      const k: number = (start + i) % n;
      const f: number = flags[k]!;
      let j: number = i;

      while (j + 1 < n && flags[(start + j + 1) % n] === f) j++;

      if (f !== 0) out.push({ from: k, to: (start + j) % n, sign: f });
      i = j + 1;
    }

    return out;
  }

  /** Anatomical name of a direction: its dominant world axes, such as "front-left". */
  export function bearing(d: V3): string {
    const names: string[][] = [
      ["back", "front"],
      ["down", "up"],
      ["right", "left"],
    ];
    const length: number = Math.hypot(...d) || 1;
    const order: number[] = [0, 1, 2].sort((a: number, b: number): number => Math.abs(d[b]!) - Math.abs(d[a]!));
    const parts: string[] = [];

    for (const axis of order)
      if (Math.abs(d[axis]!) / length >= 0.4 || parts.length === 0) parts.push(names[axis]![d[axis]! >= 0 ? 1 : 0]!);

    return parts.join("-");
  }

  /**
   * The shortest phase interval holding every given phase, degrees: from the
   * phase after the widest gap round the circle to the phase before it.
   *
   * A generated loop may run against the chain's phase, so a run's two ends
   * alone do not name its interval.
   *
   * @param phases Phases in degrees.
   */
  export function arc(phases: number[]): [number, number] {
    const sorted: number[] = [...new Set(phases.map((x: number): number => ((x % 360) + 360) % 360))].sort(
      (a: number, b: number): number => a - b,
    );

    if (sorted.length === 0) return [NaN, NaN];

    let widest: number = -1;
    let at: number = 0;

    for (let i: number = 0; i < sorted.length; i++) {
      const gap: number = (sorted[(i + 1) % sorted.length]! - sorted[i]! + 360) % 360 || (sorted.length === 1 ? 360 : 0);

      if (gap > widest) {
        widest = gap;
        at = i;
      }
    }

    return [sorted[(at + 1) % sorted.length]!, sorted[at]!];
  }
}
