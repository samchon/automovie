import type { AutoMovieRecoveryCompactApproximation as C, AutoMovieRecoveryConicApproximation as P } from "@automovie/recovery";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { NodeCanvasCamera as V } from "./render/NodeCanvasCamera";
import { CompactCurveSource as S } from "./CompactCurveSource";
import type { CompactCurveFit as F } from "./CompactCurveFit";
import type { ConicPaperInput as I } from "./ConicPaperInput";

/** Coefficient-only controlled grids isolate sampling from independent row-fit derivatives; all analysis uses millimetres. */
export namespace SurfaceQualityData {
  /** One unchanged saved source row and its already fitted polynomial representation. */
  export interface Row {
    /** Actual original source identity and physical world-Y station. */
    loop: I.Loop;
    /** Exact original cubic coefficients and analytic physical-phase callbacks. */
    source: S.Prepared;
    /** Saved complete degree-three result, without fitting or geometric repair. */
    pieces: readonly C.IPiece[];
    /** Original physical phase period in millimetres. */
    period: number;
    /** Source-only positive-X support phase, normalized by the period. */
    anchor: number;
  }

  /** Select up to 24 consecutive reciprocal rows around a disclosed source key, stopping at events and unavailable coefficients. */
  export function rows(packet: I.Packet, fit: F.Result, seed: string): Row[] {
    const loops: Map<string, I.Loop> = new Map(packet.loops.map((l: I.Loop): [string, I.Loop] => [l.key, l]));
    const records: Map<string, F.Record> = new Map(fit.records.map((r: F.Record): [string, F.Record] => [r.key, r]));
    const center: I.Loop = loops.get(seed)!;
    if (center === undefined) throw new Error("Missing ROI seed " + seed);
    const usable = (l: I.Loop | undefined): l is I.Loop => l !== undefined && l.region === center.region && records.get(l.key)?.status === "complete";
    const chain: I.Loop[] = [center];
    for (const direction of [-1, 1]) {
      let current: I.Loop = center;
      for (let k: number = 0; k < (direction < 0 ? 11 : 12); ++k) {
        const links: number[] = direction < 0 ? current.below : current.above;
        if (links.length !== 1) break;
        const next: I.Loop | undefined = loops.get((current.section + direction) + ":" + links[0]);
        if (!usable(next)) break;
        const reverse: number[] = direction < 0 ? next.above : next.below;
        if (reverse.length !== 1 || reverse[0] !== current.ordinal) break;
        if (direction < 0) chain.unshift(next); else chain.push(next);
        current = next;
      }
    }
    return chain.map((loop: I.Loop): Row => {
      const source: S.Prepared = S.prepare(loop);
      if (source.refusals.length > 0) throw new Error("Source ROI refusal: " + source.refusals.join(";"));
      const period: number = source.curve.domain[1] - source.curve.domain[0];
      return { loop, source, pieces: records.get(loop.key)!.result!.pieces, period, anchor: support(source.pieces) / period };
    });
  }

  /** Evaluate the exact saved polynomial derivative with respect to a shared normalized source clock, not a new arclength. */
  export function point(row: Row, q: number, fitted: boolean, anchored: boolean, order: number = 0): P.Point {
    const phase: number = (((q + (anchored ? row.anchor : 0)) % 1) + 1) % 1 * row.period;
    const pieces: readonly C.IPiece[] = fitted ? row.pieces : row.source.pieces;
    let lo: number = 0, hi: number = pieces.length - 1;
    while (lo < hi) { const mid: number = Math.floor((lo + hi) / 2); if (phase < pieces[mid]!.domain[1]) hi = mid; else lo = mid + 1; }
    const piece: C.IPiece = pieces[lo]!;
    if (piece.kind !== "polynomial") throw new Error("This registered control excludes independent rational clocks");
    const h: number = piece.domain[1] - piece.domain[0];
    const u: number = Math.max(0, Math.min(1, (phase - piece.domain[0]) / h));
    let controls: P.Point[] = piece.controls.map((p: P.Point): P.Point => [p[0], p[1]]);
    for (let d: number = 0; d < order; ++d) {
      const degree: number = controls.length - 1;
      controls = controls.slice(1).map((p: P.Point, i: number): P.Point => [(p[0] - controls[i]![0]) * degree * row.period / h, (p[1] - controls[i]![1]) * degree * row.period / h]);
    }
    for (let n: number = controls.length - 1; n > 0; --n)
      for (let i: number = 0; i < n; ++i) controls[i] = [(1 - u) * controls[i]![0] + u * controls[i + 1]![0], (1 - u) * controls[i]![1] + u * controls[i + 1]![1]];
    return controls[0]!;
  }

  /** Produce identical cyclic quad diagonals for source and candidate; no minimum-area seam selection participates. */
  export function mesh(rows: readonly Row[], fitted: boolean, anchored: boolean, count: number): { mesh: N.Mesh; curves: N.Curve[] } {
    const positions: number[] = [], indices: number[] = [];
    const curves: N.Curve[] = [];
    for (const row of rows) {
      const points: N.Point[] = [];
      for (let j: number = 0; j < count; ++j) { const p: P.Point = point(row, j / count, fitted, anchored); positions.push(p[0] / 1000, row.loop.heightMm / 1000, p[1] / 1000); points.push([p[0] / 1000, row.loop.heightMm / 1000, p[1] / 1000]); }
      curves.push({ id: row.loop.key, points, closed: true, colour: fitted ? "bc4b28" : "316a99" });
    }
    for (let i: number = 0; i + 1 < rows.length; ++i) for (let j: number = 0; j < count; ++j) {
      const a: number = i * count + j, b: number = i * count + (j + 1) % count, c: number = (i + 1) * count + j, d: number = (i + 1) * count + (j + 1) % count;
      indices.push(a, c, b, b, c, d);
    }
    return { mesh: { id: "shared-source-phase-" + (anchored ? "support" : "raw") + (fitted ? "-new" : "-old"), positions, indices, colour: [0.64, 0.65, 0.67] }, curves };
  }

  /** Exact ruled-slab derivatives expose error amplification; these samples are observations, not interval certificates. */
  export function metrics(rows: readonly Row[], anchored: boolean, count: number): object {
    const errors: number[] = [], dq: number[] = [], dqq: number[] = [], ds: number[] = [], normal: number[] = [], sourceSlopes: number[] = [], newSlopes: number[] = [], slopeJumps: number[] = [];
    let minH: number = Infinity, reversedNormals: number = 0, minSourceJacobian: number = Infinity, minNewJacobian: number = Infinity;
    let maximumSlope: number = -Infinity, maximumNormal: number = -Infinity;
    let slopeWitness: object | null = null, normalWitness: object | null = null;
    for (const row of rows) for (let j: number = 0; j < count; ++j) for (let order: number = 0; order < 3; ++order) {
      const a: P.Point = point(row, (j + 0.371) / count, false, anchored, order), b: P.Point = point(row, (j + 0.371) / count, true, anchored, order);
      [errors, dq, dqq][order]!.push(Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    for (let i: number = 0; i + 1 < rows.length; ++i) {
      const a: Row = rows[i]!, b: Row = rows[i + 1]!, h: number = b.loop.heightMm - a.loop.heightMm;
      if (!(h > 0)) throw new Error("Non-increasing original world-Y stations");
      minH = Math.min(minH, h);
      for (let j: number = 0; j < count; ++j) {
        const q: number = (j + 0.371) / count;
        const pa: P.Point = point(a, q, false, anchored), pb: P.Point = point(b, q, false, anchored), na: P.Point = point(a, q, true, anchored), nb: P.Point = point(b, q, true, anchored);
        const ss: N.Point = [(pb[0] - pa[0]) / h, 1, (pb[1] - pa[1]) / h], ns: N.Point = [(nb[0] - na[0]) / h, 1, (nb[1] - na[1]) / h];
        const errorSlope: number = Math.hypot(ns[0] - ss[0], ns[2] - ss[2]);
        ds.push(errorSlope); sourceSlopes.push(Math.hypot(ss[0], ss[2])); newSlopes.push(Math.hypot(ns[0], ns[2]));
        if (errorSlope > maximumSlope) { maximumSlope = errorSlope; slopeWitness = { lower: a.loop.key, upper: b.loop.key, lowerYmm: a.loop.heightMm, upperYmm: b.loop.heightMm, hMm: h, q, sourceLowerXZmm: pa, sourceUpperXZmm: pb, candidateLowerXZmm: na, candidateUpperXZmm: nb, errorSlopeMmPerMm: errorSlope }; }
        if (i > 0) {
          const previous: Row = rows[i - 1]!, hp: number = a.loop.heightMm - previous.loop.heightMm;
          const po: P.Point = point(previous, q, false, anchored), pn: P.Point = point(previous, q, true, anchored);
          slopeJumps.push(Math.hypot((ns[0] - ss[0]) - ((na[0] - pn[0]) - (pa[0] - po[0])) / hp, (ns[2] - ss[2]) - ((na[1] - pn[1]) - (pa[1] - po[1])) / hp));
        }
        for (const v of [0, 0.5, 1]) {
          const ad: P.Point = point(a, q, false, anchored, 1), bd: P.Point = point(b, q, false, anchored, 1), an: P.Point = point(a, q, true, anchored, 1), bn: P.Point = point(b, q, true, anchored, 1);
          const so: N.Point = V.cross([(1 - v) * ad[0] + v * bd[0], 0, (1 - v) * ad[1] + v * bd[1]], ss), sn: N.Point = V.cross([(1 - v) * an[0] + v * bn[0], 0, (1 - v) * an[1] + v * bn[1]], ns);
          minSourceJacobian = Math.min(minSourceJacobian, Math.hypot(...so)); minNewJacobian = Math.min(minNewJacobian, Math.hypot(...sn));
          if (V.dot(so, sn) < 0) ++reversedNormals;
          const degrees: number = angle(so, sn);
          normal.push(degrees);
          if (degrees > maximumNormal) { maximumNormal = degrees; normalWitness = { lower: a.loop.key, upper: b.loop.key, hMm: h, q, slabV: v, sourceJacobian: so, candidateJacobian: sn, degrees }; }
        }
      }
    }
    return { rows: rows.length, count, anchored, minStationGapMm: minH, positionErrorMm: summary(errors), displacementDqMm: summary(dq), displacementDqqMm: summary(dqq), displacementDsMmPerMm: summary(ds), displacementDsJumpAtRows: summary(slopeJumps), sourceHorizontalSlope: summary(sourceSlopes), candidateHorizontalSlope: summary(newSlopes), normalDifferenceDegrees: summary(normal), reversedNormals, minSourceJacobian, minNewJacobian, slopeWitness, normalWitness, policy: "Exact derivatives of unchanged coefficients and the explicitly ruled common-clock surface. Samples are not global bounds. d2/ds2 is zero within each slab; slope jumps are not smoothed. Source normalized/support phase is a declared diagnostic chart, not proven material correspondence." };
  }

  /** Stable angle avoids acos amplification for almost parallel vectors. */
  export function angle(a: N.Point, b: N.Point): number { return Math.atan2(Math.hypot(...V.cross(a, b)), V.dot(a, b)) * 180 / Math.PI; }

  /** Compact quantiles retain maxima rather than hiding a local failure inside an average. */
  export function summary(values: number[]): object { const sorted: number[] = values.filter(Number.isFinite).sort((a: number, b: number): number => a - b); return { count: sorted.length, median: sorted[Math.floor(sorted.length * 0.5)] ?? null, p95: sorted[Math.floor(sorted.length * 0.95)] ?? null, maximum: sorted.at(-1) ?? null }; }

  /** Positive-X source support is solved analytically on each original cubic; no candidate-dependent seam is introduced. */
  function support(pieces: readonly C.IPiece[]): number {
    let maximum: number = -Infinity, phase: number = 0;
    for (const piece of pieces) {
      if (piece.kind !== "polynomial" || piece.degree !== 3) throw new Error("Source cubic required");
      const p: number[] = piece.controls.map((c: P.Point): number => c[0]);
      const a: number = -p[0]! + 3 * p[1]! - 3 * p[2]! + p[3]!, b: number = 2 * (p[0]! - 2 * p[1]! + p[2]!), c: number = p[1]! - p[0]!;
      const roots: number[] = [0, 1];
      if (a === 0) { if (b !== 0) roots.push(-c / b); }
      else { const d: number = b * b - 4 * a * c; if (d >= 0) roots.push((-b + Math.sqrt(d)) / (2 * a), (-b - Math.sqrt(d)) / (2 * a)); }
      for (const u of roots) if (u >= 0 && u <= 1) {
        const v: number = 1 - u, x: number = v ** 3 * p[0]! + 3 * v ** 2 * u * p[1]! + 3 * v * u ** 2 * p[2]! + u ** 3 * p[3]!;
        if (x > maximum) { maximum = x; phase = piece.domain[0] + u * (piece.domain[1] - piece.domain[0]); }
      }
    }
    return phase;
  }
}
