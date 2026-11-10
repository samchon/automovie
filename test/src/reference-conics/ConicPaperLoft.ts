import { tessellateAutoMovieContourStrip64 } from "@automovie/engine";
import { AutoMovieRecoveryConicApproximation as C } from "@automovie/recovery";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { ConicPaperInput as I } from "./ConicPaperInput";
import type { ConicPaperFit as F } from "./ConicPaperFit";

/** Independent coefficient-only realization, restricted to explicitly reciprocal one-to-one saved continuations. */
export namespace ConicPaperLoft {
  /** Diagnostic result distinguishes unavailable curves, original branch relations and strip qualification. */
  export interface Result {
    /** Independently generated metre positions and triangle indices; contains no native surface fallback. */
    mesh: N.Mesh;
    /** Actually evaluated complete ring construction in metres, including rings not consumed by a strip. */
    curves: N.Curve[];
    /** Ring sampling, admission and strip tessellation wall time, in milliseconds. */
    milliseconds: number;
    /** Complete fitted or source rings admitted for display and possible strip generation. */
    completeRings: number;
    /** Missing/incomplete conic records or rings with fewer than three distinct sampled points. */
    unavailableRings: number;
    /** Rings withheld because sampled vertices exceed the explicit 512-point study limit. */
    overSamplingBudget: number;
    /** Rings rejected as nonfinite, degenerate, repeated-point or self-intersecting boundaries. */
    rejectedRings: number;
    /** Unique original closed curves actually consumed by at least one emitted strip. */
    usedSurfaceCurves: number;
    /** Reciprocal one-to-one saved link pairs considered, independently of ring availability. */
    reciprocalPairs: number;
    /** Strip calls that returned finite displayable geometry, whether qualified or not. */
    generatedStrips: number;
    /** Reciprocal pairs omitted because a ring was unavailable or the strip call threw. */
    omittedStrips: number;
    /** Source links outside reciprocal one-to-one continuation; no branch surface is invented. */
    branchesNotGenerated: number;
    /** Displayable emitted strips whose kernel qualification remained false. */
    unqualifiedStrips: number;
    /** Original before/after identities and exact strip exceptions, retained for every failed call. */
    failures: { before: string; after: string; reason: string }[];
  }

  /** Tessellate rational coefficients directly; original triangles never enter this producer. */
  export function build(packet: I.Packet, name: string, fitted?: F.Result): Result {
    const started: number = performance.now();
    const rings: Map<string, [number, number, number][]> = new Map();
    const byKey: Map<string, F.Record> = new Map(fitted?.records.map((record: F.Record): [string, F.Record] => [record.key, record]) ?? []);
    const positions: number[] = [];
    const indices: number[] = [];
    const result: Result = { mesh: { id: name + ".coefficient-loft", positions, indices, colour: [0.64, 0.65, 0.67] }, curves: [], milliseconds: 0,
      completeRings: 0, unavailableRings: 0, overSamplingBudget: 0, rejectedRings: 0, usedSurfaceCurves: 0, reciprocalPairs: 0, generatedStrips: 0, omittedStrips: 0,
      branchesNotGenerated: 0, unqualifiedStrips: 0, failures: [] };
    for (const loop of packet.loops) {
      const record: F.Record | undefined = byKey.get(loop.key);
      if (fitted !== undefined && record?.status !== "complete") { ++result.unavailableRings; continue; }
      const points: C.Point[] = [];
      const count: number = fitted === undefined ? loop.curve.spans.length : record!.arcs.length;
      for (let i: number = 0; i < count; ++i) {
        const evaluate = (u: number): C.Point => fitted === undefined ? I.value(loop.curve.spans[i]!, u, 0) : C.evaluate(record!.arcs[i]!, u);
        const samples: C.Point[] = sample(evaluate);
        points.push(...samples.slice(0, -1));
      }
      if (points.length > 512) { ++result.overSamplingBudget; continue; }
      const ring: [number, number, number][] = [];
      for (const p of points) {
        const previous: [number, number, number] | undefined = ring[ring.length - 1];
        if (previous === undefined || Math.hypot(previous[0] - p[0], previous[2] - p[1]) > 1e-9)
          ring.push([p[0], loop.heightMm, p[1]]);
      }
      if (ring.length < 3) { ++result.unavailableRings; continue; }
      if (!admit(ring)) { ++result.rejectedRings; continue; }
      rings.set(loop.key, ring);
      ++result.completeRings;
      result.curves.push({ id: name + "." + loop.curve.name, points: ring.map((p: I.V): N.Point => [p[0] / 1000, p[1] / 1000, p[2] / 1000]), closed: true, colour: fitted === undefined ? "2f6a9b" : name === "ahn" ? "bf4e2d" : "327a43" });
    }

    const lookup: Map<string, I.Loop> = new Map(packet.loops.map((loop: I.Loop): [string, I.Loop] => [loop.key, loop]));
    const identities: Map<[number, number, number], number> = new Map();
    const used: Set<string> = new Set();
    const emit = (a: [number, number, number], b: [number, number, number], c: [number, number, number]): void => {
      for (const p of [a, b, c]) {
        let index: number | undefined = identities.get(p);
        if (index === undefined) {
          index = positions.length / 3;
          identities.set(p, index);
          positions.push(p[0] / 1000, p[1] / 1000, p[2] / 1000);
        }
        indices.push(index);
      }
    };
    for (const loop of packet.loops) {
      if (loop.above.length !== 1) { if (loop.above.length > 1) ++result.branchesNotGenerated; continue; }
      const after: I.Loop | undefined = lookup.get((loop.section + 1) + ":" + loop.above[0]);
      if (after === undefined || after.below.length !== 1 || after.below[0] !== loop.ordinal) { ++result.branchesNotGenerated; continue; }
      ++result.reciprocalPairs;
      const a: [number, number, number][] | undefined = rings.get(loop.key);
      const b: [number, number, number][] | undefined = rings.get(after.key);
      if (a === undefined || b === undefined) { ++result.omittedStrips; continue; }
      try {
        tessellateAutoMovieContourStrip64(a, b, emit, undefined, (observation): void => {
          if (!observation.qualified) ++result.unqualifiedStrips;
        });
        ++result.generatedStrips;
        used.add(loop.key);
        used.add(after.key);
      } catch (error) {
        ++result.omittedStrips;
        result.failures.push({ before: loop.key, after: after.key, reason: error instanceof Error ? error.message : String(error) });
      }
    }
    result.usedSurfaceCurves = used.size;
    result.milliseconds = performance.now() - started;
    return result;
  }

  /** Admit simple regular planar rings before the strip kernel's unrestricted conflict search. */
  function admit(ring: readonly [number, number, number][]): boolean {
    let area: number = 0;
    const origin: [number, number, number] = ring[0]!;
    for (let i: number = 0; i < ring.length; ++i) {
      const a: [number, number, number] = ring[i]!;
      const b: [number, number, number] = ring[(i + 1) % ring.length]!;
      if (!a.every(Number.isFinite) || Math.hypot(a[0] - b[0], a[2] - b[2]) < 1e-8) return false;
      area += (a[0] - origin[0]) * (b[2] - origin[2]) - (a[2] - origin[2]) * (b[0] - origin[0]);
      for (let j: number = i + 1; j < ring.length; ++j) {
        const c: [number, number, number] = ring[j]!;
        if (Math.hypot(a[0] - c[0], a[2] - c[2]) < 1e-8) return false;
        if (j === i + 1 || i === 0 && j === ring.length - 1) continue;
        const d: [number, number, number] = ring[(j + 1) % ring.length]!;
        const determinant = (p: I.V, q: I.V, r: I.V): number => (q[0] - p[0]) * (r[2] - p[2]) - (q[2] - p[2]) * (r[0] - p[0]);
        if (determinant(a, b, c) * determinant(a, b, d) <= 0 && determinant(c, d, a) * determinant(c, d, b) <= 0
          && Math.max(Math.min(a[0], b[0]), Math.min(c[0], d[0])) <= Math.min(Math.max(a[0], b[0]), Math.max(c[0], d[0]))
          && Math.max(Math.min(a[2], b[2]), Math.min(c[2], d[2])) <= Math.min(Math.max(a[2], b[2]), Math.max(c[2], d[2]))) return false;
      }
    }
    return Number.isFinite(area) && Math.abs(area) > 1e-12;
  }

  /** Adaptive rational or polynomial evaluation; a fixed 0.25 mm midpoint/quarter chord test is sampled evidence. */
  function sample(evaluate: (u: number) => C.Point): C.Point[] {
    const output: C.Point[] = [evaluate(0)];
    const visit = (a: number, b: number, p: C.Point, q: C.Point, depth: number): void => {
      const m: number = (a + b) / 2;
      const middle: C.Point = evaluate(m);
      const error: number = Math.max(...[0.25, 0.5, 0.75].map((fraction: number): number => {
        const point: C.Point = evaluate(a + (b - a) * fraction);
        const dx: number = q[0] - p[0];
        const dy: number = q[1] - p[1];
        const square: number = dx * dx + dy * dy;
        const t: number = square === 0 ? 0 : Math.max(0, Math.min(1, ((point[0] - p[0]) * dx + (point[1] - p[1]) * dy) / square));
        return Math.hypot(point[0] - p[0] - t * dx, point[1] - p[1] - t * dy);
      }));
      if (error > 0.25 && depth < 8) {
        visit(a, m, p, middle, depth + 1);
        visit(m, b, middle, q, depth + 1);
      } else output.push(q);
    };
    visit(0, 1, output[0]!, evaluate(1), 0);
    return output;
  }
}
