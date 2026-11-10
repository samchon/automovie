import { AutoMovieViewChain as Q } from "../../../packages/engine/src/geometry/construction/AutoMovieViewChain";
import type { PartConicTypes as T } from "./PartConicTypes";

/** Source support contacts and tangent-line conics in one unmodified native section chart. */
export namespace PartConicProfile {
  /** Exact polygon-ray intersection; multiple distinct positive hits refuse a star-shaped interpretation. */
  export function radius(points: readonly T.P[], phi: number): number {
    const d: T.P = [Math.cos(phi), Math.sin(phi)];
    const hits: number[] = [];
    for (let i: number = 0; i < points.length; ++i) {
      const a: T.P = points[i]!;
      const b: T.P = points[(i + 1) % points.length]!;
      // Classify the same line-side values before interpolation. Solving t from
      // an independently rounded edge determinant can place a vertex just
      // outside both incident [0,1] intervals. A half-open sign crossing cannot
      // lose that boundary and introduces neither a geometric tolerance nor a
      // new source point. Collinear positive endpoints remain explicit hits.
      const sa: number = cross(a, d); const sb: number = cross(b, d);
      const ra: number = a[0] * d[0] + a[1] * d[1];
      const rb: number = b[0] * d[0] + b[1] * d[1];
      if (sa === 0 && sb === 0) {
        for (const value of [ra, rb]) if (value > 0 && !hits.some((h: number): boolean => Math.abs(h - value) < 1e-8)) hits.push(value);
        continue;
      }
      if ((sa > 0) === (sb > 0)) continue;
      const t: number = sa / (sa - sb);
      const r: number = (1 - t) * ra + t * rb;
      if (r > 0 && !hits.some((h: number): boolean => Math.abs(h - r) < 1e-8)) hits.push(r);
    }
    if (hits.length !== 1) throw new Error("Native section is not a single-valued radial profile: " + hits.length + " positive intersections.");
    return hits[0]!;
  }

  /** Observe four supports, their actual touch offsets, and either one or two conics per quarter. */
  export function measure(points: readonly T.P[], pieces: 1 | 2): number[] {
    const extremes: T.P[] = [points.reduce((a: T.P, b: T.P): T.P => b[0] > a[0] ? b : a), points.reduce((a: T.P, b: T.P): T.P => b[1] > a[1] ? b : a), points.reduce((a: T.P, b: T.P): T.P => b[0] < a[0] ? b : a), points.reduce((a: T.P, b: T.P): T.P => b[1] < a[1] ? b : a)];
    const tangents: T.P[] = [[0, 1], [-1, 0], [0, -1], [1, 0]];
    const values: number[] = [extremes[0]![0], extremes[2]![0], extremes[1]![1], extremes[3]![1], extremes[0]![1], extremes[1]![0], extremes[2]![1], extremes[3]![0], 0, 0, 0, 0];
    let previous: number = Math.atan2(extremes[0]![1], extremes[0]![0]);
    for (let q: number = 0; q < 4; ++q) {
      const a: T.P = extremes[q]!;
      const b: T.P = extremes[(q + 1) % 4]!;
      let end: number = Math.atan2(b[1], b[0]);
      while (end <= previous) end += 2 * Math.PI;
      if (pieces === 1) values[8 + q] = shoulder(points, a, tangents[q]!, b, tangents[(q + 1) % 4]!);
      else {
        const phi: number = (previous + end) / 2;
        const r: number = radius(points, phi);
        const split: T.P = [r * Math.cos(phi), r * Math.sin(phi)];
        const tangent: T.P = observedTangent(points, split);
        let angle: number = Math.atan2(tangent[1], tangent[0]);
        while (angle < phi - Math.PI / 2) angle += 2 * Math.PI;
        while (angle > phi + 3 * Math.PI / 2) angle -= 2 * Math.PI;
        values[8 + q] = shoulder(points, a, tangents[q]!, split, tangent);
        values.push(split[0], split[1], angle, shoulder(points, split, tangent, b, tangents[(q + 1) % 4]!));
      }
      previous = end;
    }
    return values;
  }

  /** Reconstruct actual conics from support/contact/fullness fields; no source samples enter the coefficients. */
  export function section(values: readonly number[], pieces: 1 | 2): Q.ISection {
    const guides: T.P[] = [[values[0]!, values[4]!], [values[5]!, values[2]!], [values[1]!, values[6]!], [values[7]!, values[3]!]];
    const tangent: T.P[] = [[0, 1], [-1, 0], [0, -1], [1, 0]];
    const input: Q.IInput = { points: [], tangents: [], shoulders: [] };
    for (let q: number = 0; q < 4; ++q) {
      input.points.push(guides[q]!);
      input.tangents.push(tangent[q]!);
      input.shoulders.push(values[8 + q]!);
      if (pieces === 2) {
        input.points.push([values[12 + 4 * q]!, values[13 + 4 * q]!]);
        input.tangents.push([Math.cos(values[14 + 4 * q]!), Math.sin(values[14 + 4 * q]!)]);
        input.shoulders.push(values[15 + 4 * q]!);
      }
    }
    return Q.of(input);
  }

  /** Held-out position evidence includes every native polygon vertex phase and a fixed independent angular grid. */
  export function error(points: readonly T.P[], values: readonly number[], pieces: 1 | 2): number {
    const conic: Q.ISection = section(values, pieces);
    if (conic.fault !== null) return Infinity;
    let maximum: number = 0;
    const phases: number[] = [...points.map((p: T.P): number => Math.atan2(p[1], p[0])), ...Array.from({ length: 128 }, (_: unknown, i: number): number => 2 * Math.PI * i / 128)];
    for (const phi of phases) maximum = Math.max(maximum, Math.abs(Q.radius(conic, phi) - radius(points, phi)));
    return maximum;
  }

  /** Rational quadratic midpoint share rho=|M S|/|M A|, with A the actual endpoint tangent intersection. */
  function shoulder(points: readonly T.P[], p: T.P, t: T.P, q: T.P, u: T.P): number {
    const denominator: number = cross(t, u);
    if (denominator === 0) throw new Error("Parallel source tangents cannot define one finite positive conic.");
    const distance: number = cross([q[0] - p[0], q[1] - p[1]], u) / denominator;
    const corner: T.P = [p[0] + distance * t[0], p[1] + distance * t[1]];
    if (!(distance > 0 && (q[0] - corner[0]) * u[0] + (q[1] - corner[1]) * u[1] > 0)) throw new Error("One conic cannot retain these source tangent directions.");
    const middle: T.P = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const direction: T.P = [corner[0] - middle[0], corner[1] - middle[1]];
    const candidates: number[] = [];
    for (let i: number = 0; i < points.length; ++i) {
      const a: T.P = points[i]!;
      const b: T.P = points[(i + 1) % points.length]!;
      const edge: T.P = [b[0] - a[0], b[1] - a[1]];
      const divisor: number = cross(direction, edge);
      if (divisor === 0) continue;
      const delta: T.P = [a[0] - middle[0], a[1] - middle[1]];
      const rho: number = cross(delta, edge) / divisor;
      const edgePhase: number = cross(delta, direction) / divisor;
      if (rho > 0 && rho < 1 && edgePhase >= 0 && edgePhase <= 1) candidates.push(rho);
    }
    if (candidates.length === 0) throw new Error("The source quarter does not meet its positive conic shoulder diagonal.");
    return Math.min(...candidates);
  }

  /** A symmetric 4 mm arclength chord estimates a tangent of the faceted source without moving its contact point. */
  function observedTangent(points: readonly T.P[], target: T.P): T.P {
    const lengths: number[] = [0];
    let nearest: number = Infinity;
    let at: number = 0;
    for (let i: number = 0; i < points.length; ++i) {
      const a: T.P = points[i]!;
      const b: T.P = points[(i + 1) % points.length]!;
      const dx: number = b[0] - a[0]; const dy: number = b[1] - a[1];
      const square: number = dx * dx + dy * dy;
      const t: number = square === 0 ? 0 : Math.max(0, Math.min(1, ((target[0] - a[0]) * dx + (target[1] - a[1]) * dy) / square));
      const error: number = Math.hypot(target[0] - a[0] - t * dx, target[1] - a[1] - t * dy);
      if (error < nearest) { nearest = error; at = lengths[i]! + t * Math.sqrt(square); }
      lengths.push(lengths[i]! + Math.sqrt(square));
    }
    const sample = (s: number): T.P => {
      const wrapped: number = ((s % lengths.at(-1)!) + lengths.at(-1)!) % lengths.at(-1)!;
      let i: number = 0; while (lengths[i + 1]! < wrapped) ++i;
      const t: number = (wrapped - lengths[i]!) / (lengths[i + 1]! - lengths[i]!);
      return [points[i]![0] + t * (points[(i + 1) % points.length]![0] - points[i]![0]), points[i]![1] + t * (points[(i + 1) % points.length]![1] - points[i]![1])];
    };
    const a: T.P = sample(at - 2); const b: T.P = sample(at + 2);
    return [b[0] - a[0], b[1] - a[1]];
  }
  /** Signed determinant in the original in-plane chart. */
  function cross(a: T.P, b: T.P): number { return a[0] * b[1] - a[1] * b[0]; }
}
