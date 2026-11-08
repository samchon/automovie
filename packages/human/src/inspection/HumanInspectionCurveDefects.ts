/**
 * Universal defect detectors of sampled curves, whatever made them: a closed
 * section that crosses itself or winds the wrong way, a rail that turns
 * back, a turn sharper than the smallest radius skin takes, and curvature
 * spikes or ripples along a curve. Each reads only the sampled points.
 */
export namespace HumanInspectionCurveDefects {
  /** One finding at a sample. */
  export interface IFinding {
    /** "crossing", "orientation", "fold", "crease", "spike" or "ripple". */
    kind: "crossing" | "orientation" | "fold" | "crease" | "spike" | "ripple";

    /** Sample index (for a crossing, the first segment's start). */
    index: number;

    /** The measured value: the other segment for a crossing, the signed area, the step, the curvature or its jump. */
    value: number;
  }

  type V2 = readonly [number, number];
  type V3 = readonly [number, number, number];

  /**
   * A closed section's defects: every pair of non-adjacent segments that
   * cross (the loop is not simple), and the wrong winding when the signed
   * area's sign differs from the expected one.
   *
   * @param points The section's points in its own plane, closed implicitly (last to first).
   * @param winding Expected winding: 1 counter-clockwise, -1 clockwise.
   */
  export function loop(points: readonly V2[], winding: 1 | -1): IFinding[] {
    const out: IFinding[] = [];
    const n: number = points.length;
    for (let i: number = 0; i < n; ++i)
      for (let j: number = i + 2; j < n; ++j) {
        if (i === 0 && j === n - 1) continue;
        if (crosses(points[i]!, points[(i + 1) % n]!, points[j]!, points[(j + 1) % n]!)) out.push({ kind: "crossing", index: i, value: j });
      }
    let area: number = 0;
    for (let i: number = 0; i < n; ++i) {
      const p: V2 = points[i]!;
      const q: V2 = points[(i + 1) % n]!;
      area += p[0] * q[1] - q[0] * p[1];
    }
    area /= 2;
    if (!(Math.sign(area) === winding)) out.push({ kind: "orientation", index: 0, value: area });
    return out;
  }

  /**
   * Every step where a rail's station turns back: the stations must advance
   * strictly in one direction along the rail (a section or column that folds
   * over itself steps backward).
   *
   * @param stations The rail's stations in order.
   * @param direction 1 when they must increase, -1 when they must decrease.
   */
  export function fold(stations: readonly number[], direction: 1 | -1): IFinding[] {
    const out: IFinding[] = [];
    for (let i: number = 1; i < stations.length; ++i) {
      const step: number = direction * (stations[i]! - stations[i - 1]!);
      if (!(step > 0)) out.push({ kind: "fold", index: i, value: step });
    }
    return out;
  }

  /**
   * The discrete curvature at each interior sample of an open polyline: the
   * turn angle between its two segments over their mean length (exact for
   * samples on a circle as the spacing shrinks).
   *
   * @param points The polyline.
   */
  export function curvature(points: readonly V3[]): number[] {
    const out: number[] = [];
    for (let i: number = 1; i + 1 < points.length; ++i) {
      const a: V3 = points[i - 1]!;
      const b: V3 = points[i]!;
      const c: V3 = points[i + 1]!;
      const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v: V3 = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
      const lu: number = Math.hypot(...u);
      const lv: number = Math.hypot(...v);
      const cos: number = Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (lu * lv)));
      out.push(Math.acos(cos) / ((lu + lv) / 2));
    }
    return out;
  }

  /**
   * Every interior sample whose turn is sharper than the smallest radius
   * smooth skin takes.
   *
   * @param points The polyline.
   * @param radius The smallest admitted radius, the polyline's units.
   */
  export function crease(points: readonly V3[], radius: number): IFinding[] {
    return curvature(points)
      .map((k: number, i: number): IFinding => ({ kind: "crease", index: i + 1, value: k }))
      .filter((f: IFinding): boolean => !(f.value <= 1 / radius));
  }

  /**
   * Curvature spikes and ripples along a polyline of even spacing: a spike
   * where a sample's curvature leaves its two neighbours' mean by more than
   * the limit; a ripple where the turn reverses its direction at three
   * successive samples, each turning by more than the limit (a wave no
   * smooth curve sampled finer than its features shows).
   *
   * @param points The polyline.
   * @param limit Admitted curvature jump, inverse units.
   */
  export function spikes(points: readonly V3[], limit: number): IFinding[] {
    const k: number[] = curvature(points);
    const out: IFinding[] = [];
    for (let i: number = 1; i + 1 < k.length; ++i) {
      const d: number = k[i]! - (k[i - 1]! + k[i + 1]!) / 2;
      if (Math.abs(d) > limit) out.push({ kind: "spike", index: i + 1, value: d });
    }
    const turn: V3[] = [];
    for (let i: number = 1; i + 1 < points.length; ++i) {
      const a: V3 = points[i - 1]!;
      const b: V3 = points[i]!;
      const c: V3 = points[i + 1]!;
      const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v: V3 = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
      turn.push([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]);
    }
    const dot: (p: V3, q: V3) => number = (p: V3, q: V3): number => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
    for (let i: number = 1; i + 1 < turn.length; ++i)
      if (dot(turn[i - 1]!, turn[i]!) < 0 && dot(turn[i]!, turn[i + 1]!) < 0 && Math.min(k[i - 1]!, k[i]!, k[i + 1]!) > limit)
        out.push({ kind: "ripple", index: i + 1, value: k[i]! });
    return out;
  }

  /** Whether the open segments ab and cd cross properly. */
  function crosses(a: V2, b: V2, c: V2, d: V2): boolean {
    const o1: number = orient(a, b, c);
    const o2: number = orient(a, b, d);
    const o3: number = orient(c, d, a);
    const o4: number = orient(c, d, b);
    return o1 * o2 < 0 && o3 * o4 < 0;
  }

  function orient(a: V2, b: V2, c: V2): number {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  }
}
