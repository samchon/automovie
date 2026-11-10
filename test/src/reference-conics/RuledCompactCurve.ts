import { AutoMovieBernstein64 as B, type IAutoMovieCurve64 as G } from "@automovie/engine";
import type { AutoMovieRecoveryCompactApproximation as C } from "../../../packages/recovery/src/curves/AutoMovieRecoveryCompactApproximation";
import type { AutoMovieRecoveryConicApproximation as P } from "../../../packages/recovery/src/curves/AutoMovieRecoveryConicApproximation";

/** Physical cubic adapters and coefficient-based error admission for the whole ruled experiment. */
export namespace RuledCompactCurve {
  /** A supported planar chart or an explicit reason to keep the original representation. */
  export type Prepared = { accepted: true; source: C.ICurve; planeMm: number; period: number } | { accepted: false; reason: string };
  /** Conservative real-arithmetic convex-hull estimate, with binary64 qualification. */
  export interface Bound {
    /** Whether every polynomial overlap's upper estimate is within the additional tolerance. */
    accepted: boolean;
    /** Largest admitted leaf-control norm, in world millimetres. */
    upperMm: number;
    /** Largest independently evaluated endpoint/midpoint discrepancy, millimetres. */
    observedMm: number;
    /** Actual coefficient subdivision work, including rejected leaves. */
    visits: number;
    /** Empty on admission, otherwise the exact reason for retaining the source. */
    reason: string;
  }

  /** Preserve the original physical phase and exact one-sided cubic jets; open arcs never acquire a closing seam. */
  export function prepare(curve: G.Cubic): Prepared {
    const prefix: number[] = [0];
    const jets: B.Poly[][] = [];
    const plane: number | undefined = curve.spans[0]?.[0][1];
    if (plane === undefined || !Number.isFinite(plane)) return { accepted: false, reason: "nonfinite-or-empty-source" };
    const allowance: number = 128 * Number.EPSILON * Math.max(1, Math.abs(plane));
    for (const [i, span] of curve.spans.entries()) {
      const width: number = curve.phaseIntervals[i]!;
      const next: number = prefix.at(-1)! + width;
      if (!(width > 0 && Number.isFinite(next) && next > prefix.at(-1)!)) return { accepted: false, reason: "unresolved-source-phase" };
      if (span.some((p: G.Vector): boolean => !p.every(Number.isFinite) || Math.abs(p[1] - plane) > allowance)) return { accepted: false, reason: "nonplanar-source" };
      const levels: B.Poly[] = [span.map((p: G.Vector): B.Vec => [p[0], p[1], p[2]])];
      for (let order: number = 1; order <= 3; ++order) levels.push(B.tangent(levels.at(-1)!, 1 / width));
      jets.push(levels);
      prefix.push(next);
    }
    const breaks: number[] = [];

    /** A first nonzero Taylor jet owns the geometric tangent without replacing any actual derivative callback. */
    const tangent = (span: number, end: boolean): P.Point | null => {
      for (let order: number = 1; order <= 3; ++order) {
        const p: B.Vec = end ? jets[span]![order]!.at(-1)! : jets[span]![order]![0]!;
        if (Math.hypot(p[0], p[2]) > 0) {
          const sign: number = end && order % 2 === 0 ? -1 : 1;
          return [sign * p[0], sign * p[2]];
        }
      }
      return null;
    };
    for (let i: number = 0; i < curve.spans.length; ++i) {
      const j: number = i + 1;
      if (j === curve.spans.length && !curve.closed) break;
      const next: number = j % curve.spans.length;
      const a: G.Vector = curve.spans[i]![3];
      const b: G.Vector = curve.spans[next]![0];
      if (a.some((value: number, axis: number): boolean => value !== b[axis])) return { accepted: false, reason: "original-position-gap" };
      const left: P.Point | null = tangent(i, true);
      const right: P.Point | null = tangent(next, false);
      const angle: number = left === null || right === null ? Infinity : Math.atan2(Math.abs(left[0] * right[1] - left[1] * right[0]), left[0] * right[0] + left[1] * right[1]);
      if (j < curve.spans.length && angle > 1e-5 * Math.PI / 180) breaks.push(prefix[j]!);
    }
    const period: number = prefix.at(-1)!;

    /** Binary lookup selects the requested incident source polynomial exactly at a stored phase boundary. */
    const query = (t: number, order: 0 | 1 | 2 | 3 | 4 | 5, side?: "left" | "right"): P.Point => {
      if (order > 3) return [0, 0];
      let lo: number = 0;
      let hi: number = curve.spans.length - 1;
      while (lo < hi) {
        const middle: number = (lo + hi) >>> 1;
        if (t > prefix[middle + 1]! || t === prefix[middle + 1]! && side !== "left") lo = middle + 1;
        else hi = middle;
      }
      const p: B.Vec = B.value(jets[lo]![order]!, (t - prefix[lo]!) / curve.phaseIntervals[lo]!);
      return [p[0], p[2]];
    };
    return { accepted: true, planeMm: plane, period, source: { domain: [0, period], knots: prefix.slice(1, -1), breaks, closed: curve.closed,
      evaluate: (t: number): P.Point => query(t, 0), derivative: (t: number, order: 1 | 2 | 3 | 4 | 5, side?: "left" | "right"): P.Point => query(t, order, side) } };
  }

  /** Materialize true degree-three output while proving every new phase prefix, including the original total, is exactly representable. */
  export function materialize(original: G.Cubic, prepared: Prepared & { accepted: true }, result: C.IResult): G.Cubic | null {
    if (result.status !== "complete") return null;
    const spans: G.Span[] = [];
    const widths: number[] = [];
    let prefix: number = 0;
    for (const piece of result.pieces) {
      if (piece.kind !== "polynomial" || piece.degree !== 3 || piece.controls.length !== 4 || piece.domain[0] !== prefix) return null;
      const width: number = piece.domain[1] - prefix;
      if (!(width > 0) || prefix + width !== piece.domain[1]) return null;
      const point = (at: number): G.Vector => [piece.controls[at]![0], prepared.planeMm, piece.controls[at]![1]];
      spans.push([point(0), point(1), point(2), point(3)]);
      widths.push(width);
      prefix += width;
    }
    return prefix !== prepared.period ? null : { ...original, spans, phaseIntervals: widths };
  }

  /**
   * Bound the same-physical-phase difference of two actual cubic curves.
   * Restriction and subtraction are exact in real arithmetic. The Bernstein
   * convex hull bounds vector norm; subdivisions tighten it without missing
   * interior extrema. Binary64 operations are not outward-rounded certificates.
   */
  export function bound(original: G.Cubic, candidate: G.Cubic, toleranceMm: number, alive: () => boolean): Bound {
    const prefixes = (curve: G.Cubic): number[] => {
      const values: number[] = [0];
      for (const width of curve.phaseIntervals) values.push(values.at(-1)! + width);
      return values;
    };
    const a: number[] = prefixes(original);
    const b: number[] = prefixes(candidate);
    const result: Bound = { accepted: true, upperMm: 0, observedMm: 0, visits: 0, reason: "" };
    if (a.at(-1) !== b.at(-1)) return { ...result, accepted: false, reason: "physical-phase-period-changed" };
    let i: number = 0;
    let j: number = 0;
    while (i < original.spans.length && j < candidate.spans.length) {
      const start: number = Math.max(a[i]!, b[j]!);
      const end: number = Math.min(a[i + 1]!, b[j + 1]!);
      if (end > start) {
        const old: B.Poly = B.restrict(original.spans[i]!.map((p: G.Vector): B.Vec => [p[0], p[1], p[2]]), (start - a[i]!) / original.phaseIntervals[i]!, (end - a[i]!) / original.phaseIntervals[i]!);
        const next: B.Poly = B.restrict(candidate.spans[j]!.map((p: G.Vector): B.Vec => [p[0], p[1], p[2]]), (start - b[j]!) / candidate.phaseIntervals[j]!, (end - b[j]!) / candidate.phaseIntervals[j]!);
        const difference: B.Poly = old.map((p: B.Vec, k: number): B.Vec => [p[0] - next[k]![0], p[1] - next[k]![1], p[2] - next[k]![2]]);
        const pending: { controls: B.Poly; depth: number }[] = [{ controls: difference, depth: 0 }];
        while (pending.length !== 0) {
          if (!alive() || ++result.visits > 65536) return { ...result, accepted: false, reason: "bound-work-budget" };
          const item: { controls: B.Poly; depth: number } = pending.pop()!;
          const upper: number = Math.max(...item.controls.map((p: B.Vec): number => Math.hypot(...p)));
          const observed: number = Math.max(Math.hypot(...item.controls[0]!), Math.hypot(...item.controls.at(-1)!), Math.hypot(...B.value(item.controls, 0.5)));
          result.observedMm = Math.max(result.observedMm, observed);
          if (upper <= toleranceMm) { result.upperMm = Math.max(result.upperMm, upper); continue; }
          if (observed > toleranceMm || item.depth >= 24) return { ...result, accepted: false, upperMm: Math.max(result.upperMm, upper), reason: observed > toleranceMm ? "additional-error-exceeds-budget" : "unresolved-convex-hull-bound" };
          const halves: [B.Poly, B.Poly] = B.split(item.controls, 0.5);
          pending.push({ controls: halves[1], depth: item.depth + 1 }, { controls: halves[0], depth: item.depth + 1 });
        }
      }
      if (a[i + 1]! <= b[j + 1]!) ++i;
      else ++j;
    }
    return result;
  }
}
