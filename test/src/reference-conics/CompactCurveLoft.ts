import { tessellateAutoMovieContourStrip64 as strip } from "../../../packages/engine/src/geometry/curve/tessellateAutoMovieContourStrip64";
import { AutoMovieRecoveryCompactApproximation as C } from "../../../packages/recovery/src/curves/AutoMovieRecoveryCompactApproximation";
import type { NodeCanvasTypes as N } from "../../../packages/human/src/inspection/NodeCanvasTypes";
import type { AutoMovieRecoveryConicApproximation as P } from "../../../packages/recovery/src/curves/AutoMovieRecoveryConicApproximation";
import type { ConicPaperInput as I } from "./ConicPaperInput";
import type { CompactCurveFit as F } from "./CompactCurveFit";
import { CompactCurveSource as S } from "./CompactCurveSource";

/** Actual high-degree/rational coefficients feed the ordinary strip kernel without a fabricated cubic wrapper. */
export namespace CompactCurveLoft {
  /** Surface and generating curves are separate from explicit partial-coverage measurements. */
  export interface Result {
    /** Independently generated native-frame metre geometry. */
    mesh: N.Mesh;
    /** Display polylines evaluated from the same actual source or fitted coefficients. */
    curves: N.Curve[];
    /** Ring/strip timing and every finite omission reason. */
    audit: { milliseconds: number; admittedRings: number; unavailable: number; samplingBudget: number; rejectedRings: number; generatedStrips: number; unqualified: number; omittedStrips: number; branchLinks: number; actualSurfaceCurves: number; failures: { key: string; reason: string }[] };
  }

  /** Generate only selected complete rings and reciprocal one-to-one source links; no branch or native fallback is invented. */
  export function build(packet: I.Packet, keys: ReadonlySet<string>, name: string, fit?: F.Result): Result {
    const started: number = performance.now();
    const positions: number[] = [], indices: number[] = [];
    const result: Result = { mesh: { id: name + ".compact-coefficients", positions, indices, colour: [0.64, 0.65, 0.67] }, curves: [], audit: { milliseconds: 0, admittedRings: 0, unavailable: 0, samplingBudget: 0, rejectedRings: 0, generatedStrips: 0, unqualified: 0, omittedStrips: 0, branchLinks: 0, actualSurfaceCurves: 0, failures: [] } };
    const fitted: Map<string, F.Record> = new Map(fit?.records.map((r: F.Record): [string, F.Record] => [r.key, r]) ?? []);
    const rings: Map<string, P.Point[]> = new Map();
    const lookup: Map<string, I.Loop> = new Map(packet.loops.map((l: I.Loop): [string, I.Loop] => [l.key, l]));
    for (const loop of packet.loops) {
      if (!keys.has(loop.key)) continue;
      const record: F.Record | undefined = fitted.get(loop.key);
      if (fit !== undefined && record?.status !== "complete") { ++result.audit.unavailable; continue; }
      const source: S.Prepared | undefined = fit === undefined ? S.prepare(loop) : undefined;
      if (source !== undefined && source.refusals.length > 0) { ++result.audit.unavailable; result.audit.failures.push({ key: loop.key, reason: source.refusals.join("; ") }); continue; }
      const pieces: readonly C.IPiece[] = fit === undefined ? source!.pieces : record!.result!.pieces;
      const points: P.Point[] = [];
      for (const piece of pieces) points.push(...sample(piece).slice(0, -1));
      const ring: P.Point[] = points.filter((p: P.Point, i: number): boolean => i === 0 || Math.hypot(p[0] - points[i - 1]![0], p[1] - points[i - 1]![1]) > 1e-9);
      if (ring.length > 384) { ++result.audit.samplingBudget; continue; }
      if (!admit(ring)) { ++result.audit.rejectedRings; continue; }
      rings.set(loop.key, ring); ++result.audit.admittedRings;
      result.curves.push({ id: name + "." + loop.curve.name, closed: true, colour: fit === undefined ? "2f6a9b" : "bf4e2d", points: ring.map((p: P.Point): N.Point => [p[0] / 1000, loop.heightMm / 1000, p[1] / 1000]) });
    }
    const ids: Map<string, number[]> = new Map();
    for (const [key, ring] of rings) {
      const y: number = lookup.get(key)!.heightMm / 1000;
      ids.set(key, ring.map((p: P.Point): number => { const id: number = positions.length / 3; positions.push(p[0] / 1000, y, p[1] / 1000); return id; }));
    }
    const used: Set<string> = new Set();
    for (const loop of packet.loops) {
      if (!keys.has(loop.key) || loop.above.length === 0) continue;
      if (loop.above.length !== 1) { ++result.audit.branchLinks; continue; }
      const next: I.Loop | undefined = lookup.get((loop.section + 1) + ":" + loop.above[0]);
      if (next?.below.length !== 1 || next.below[0] !== loop.ordinal) { ++result.audit.branchLinks; continue; }
      const a: P.Point[] | undefined = rings.get(loop.key), b: P.Point[] | undefined = rings.get(next.key);
      if (a === undefined || b === undefined) { ++result.audit.omittedStrips; continue; }
      const ap: [number, number, number][] = a.map((p: P.Point): [number, number, number] => [p[0], loop.heightMm, p[1]]);
      const bp: [number, number, number][] = b.map((p: P.Point): [number, number, number] => [p[0], next.heightMm, p[1]]);
      const identity: Map<[number, number, number], number> = new Map([...ap.map((p: [number, number, number], i: number): [[number, number, number], number] => [p, ids.get(loop.key)![i]!]), ...bp.map((p: [number, number, number], i: number): [[number, number, number], number] => [p, ids.get(next.key)![i]!])]);
      try {
        strip(ap, bp, (p: [number, number, number], q: [number, number, number], r: [number, number, number]): void => { indices.push(identity.get(p)!, identity.get(q)!, identity.get(r)!); }, undefined, (observation): void => { if (!observation.qualified) ++result.audit.unqualified; });
        ++result.audit.generatedStrips; used.add(loop.key); used.add(next.key);
      } catch (error) { ++result.audit.omittedStrips; result.audit.failures.push({ key: loop.key + "->" + next.key, reason: error instanceof Error ? error.message : String(error) }); }
    }
    result.audit.actualSurfaceCurves = used.size; result.audit.milliseconds = performance.now() - started;
    return result;
  }

  /** Quarter/midpoint chord checks sample the actual degree/rational evaluator under a finite 0.125 mm display policy. */
  function sample(piece: C.IPiece): P.Point[] {
    const points: P.Point[] = [C.evaluate(piece, 0)];
    const visit = (a: number, b: number, p: P.Point, q: P.Point, depth: number): void => {
      const dx: number = q[0] - p[0], dy: number = q[1] - p[1], square: number = dx * dx + dy * dy;
      const error: number = Math.max(...[0.25, 0.5, 0.75].map((f: number): number => { const r: P.Point = C.evaluate(piece, a + (b - a) * f); const t: number = square === 0 ? 0 : Math.max(0, Math.min(1, ((r[0] - p[0]) * dx + (r[1] - p[1]) * dy) / square)); return Math.hypot(r[0] - p[0] - t * dx, r[1] - p[1] - t * dy); }));
      if (error > 0.125 && depth < 9 && points.length < 1024) { const m: number = (a + b) / 2, middle: P.Point = C.evaluate(piece, m); visit(a, m, p, middle, depth + 1); visit(m, b, middle, q, depth + 1); }
      else points.push(q);
    };
    visit(0, 1, points[0]!, C.evaluate(piece, 1), 0); return points;
  }

  /** Simple finite polygons are required before minimum-area strip tessellation; this does not certify the between-row skin. */
  function admit(ring: readonly P.Point[]): boolean {
    if (ring.length < 3) return false;
    const cross = (a: P.Point, b: P.Point, c: P.Point): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    let area: number = 0;
    for (let i: number = 0; i < ring.length; ++i) {
      const a: P.Point = ring[i]!, b: P.Point = ring[(i + 1) % ring.length]!;
      if (!a.every(Number.isFinite) || Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-8) return false;
      area += a[0] * b[1] - a[1] * b[0];
      for (let j: number = i + 1; j < ring.length; ++j) {
        if (j === i + 1 || i === 0 && j === ring.length - 1) continue;
        const c: P.Point = ring[j]!, d: P.Point = ring[(j + 1) % ring.length]!;
        if (cross(a, b, c) * cross(a, b, d) <= 0 && cross(c, d, a) * cross(c, d, b) <= 0 && Math.max(Math.min(a[0], b[0]), Math.min(c[0], d[0])) <= Math.min(Math.max(a[0], b[0]), Math.max(c[0], d[0])) && Math.max(Math.min(a[1], b[1]), Math.min(c[1], d[1])) <= Math.min(Math.max(a[1], b[1]), Math.max(c[1], d[1]))) return false;
      }
    }
    return Math.abs(area) > 1e-12;
  }
}
