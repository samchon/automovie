import fs from "node:fs";
import path from "node:path";
import type { IAutoMovieModel } from "@automovie/interface";
import { HumanInspectionReferenceMesh } from "../inspection/HumanInspectionReferenceMesh";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeArmMeasureForearm } from "./NodeArmMeasureForearm";

type V3 = [number, number, number];

/**
 * Measures f1's axillary arm circumference on the reference mesh by its
 * published definition, as a new public input (`node:arm-measure`).
 *
 * Definition: ANSUR 1988 ARM CIRC-AXILLARY (Gordon et al. 1989,
 * NATICK/TR-89/044): "the circumference of the right upper arm perpendicular
 * to its long axis", taken at the level of the axilla; a taut tape, so the
 * reading is the convex hull of the skin's section.
 *
 * Method, on the right arm (the definition's side), in the reference's own
 * native frame (metres times 1000, +X forward, +Y up): the arm's vertices
 * more than 210 mm to the right and above 700 mm give its slice-centroid
 * axis; the elbow is the break that best fits two straight chords through the
 * centroids above the narrowest forearm slice (the arm-specs registration's
 * rule). The whole mesh is cut by planes normal to the upper arm's own axis
 * at 1 mm steps upward from the elbow; each cut's segments join into loops
 * by shared triangle edges. The axilla level is the highest plane whose loop
 * around the arm axis stays separate from the trunk (no point beyond 90 mm
 * of the axis), the level where the arm leaves the trunk in this abducted
 * pose. The circumference is that loop's convex hull perimeter. Nothing is
 * typed by hand; the JSON records every level read.
 */
export namespace NodeArmMeasure {
  /** Measures and writes `measure-<stamp>/axillary.json`. */
  export async function run(): Promise<void> {
    const started: number = performance.now();
    const model: IAutoMovieModel = JSON.parse(fs.readFileSync(HumanNodePaths.resolve("test/.shots/f1/reference-model.json"), "utf8"));
    const positions: V3[] = [];
    const triangles: [number, number, number][] = [];
    for (const part of HumanInspectionReferenceMesh(model).parts) {
      if (part.geometry.type !== "mesh") continue;
      const base: number = positions.length;
      const p: ArrayLike<number> = part.geometry.mesh.positions;
      for (let i: number = 0; i + 2 < p.length; i += 3) positions.push([p[i]! * 1000, p[i + 1]! * 1000, p[i + 2]! * 1000]);
      const ix: ArrayLike<number> | null = part.geometry.mesh.indices;
      if (ix === null) continue;
      for (let i: number = 0; i + 2 < ix.length; i += 3) triangles.push([base + ix[i]!, base + ix[i + 1]!, base + ix[i + 2]!]);
    }
    // Native +Z is anatomical left, so the right arm lies at native z < -210 mm.
    const arm: V3[] = positions.filter((q: V3): boolean => q[2] < -210 && q[1] > 700);
    const axis: IAxis = upperAxis(arm);
    const levels: ILevel[] = [];
    let axilla: ILevel | null = null;
    for (let d: number = 40; d <= 320; d += 1) {
      const origin: V3 = add(axis.elbow, scale(axis.up, d));
      const loop: ILevel = cut(positions, triangles, origin, axis.up, d);
      levels.push(loop);
      if (loop.reach > 90 || loop.points === 0) break;
      axilla = loop;
    }
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_arm/measure-${new Date().toISOString().replace(/[:.]/g, "-")}`);
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(
      path.join(out, "axillary.json"),
      JSON.stringify(
        {
          definition: "ANSUR 1988 ARM CIRC-AXILLARY (Gordon et al. 1989 NATICK/TR-89/044): circumference of the right upper arm perpendicular to its long axis at the axilla level; taut tape (convex hull)",
          reference: "test/.shots/f1/reference-model.json",
          axis,
          axilla,
          axillaryArmCircumference: axilla?.hull ?? null,
          levels,
          milliseconds: performance.now() - started,
        },
        null,
        2,
      ),
    );
    console.log(`${out} axillary arm circumference ${axilla?.hull.toFixed(2) ?? "unread"} mm at ${axilla?.distance ?? "?"} mm above the elbow break`);

    // The forearm and wrist readings (NodeArmMeasureForearm), with f1's acromion-radiale for de Leva's radiale offset.
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    const acromionRadiale: number | undefined = person.parameters.body?.anatomy?.upperArmLength;
    if (acromionRadiale === undefined) throw new Error("f1 has no acromion-radiale input for de Leva's radiale offset");
    const forearm: NodeArmMeasureForearm.IReceipt | string = NodeArmMeasureForearm.read({ points: positions, triangles }, arm, acromionRadiale);
    fs.writeFileSync(
      path.join(out, "forearm.json"),
      JSON.stringify(
        {
          definitions: {
            radialeStylion: "ANSUR II 67 (docs/sources/ansur-ii-course-measures.md:18): radiale to stylion with a beam caliper parallel to the forearm's long axis, arms relaxed, palms forward; read as the elbow centre (ISB epicondyle midpoint) to stylion's level less de Leva 1996's radiale offset 0.0432 AR",
            forearmCaliper: "Perry et al. 2021 forearm station 0.2 RS past radiale: caliper breadth along the epicondyle line and depth across it",
            wristCaliper: "at stylion: caliper breadth along the styloid line and depth across it; the section's taut tape checks the level against the ANSUR II wrist girth over stylion",
          },
          reference: "test/.shots/f1/reference-model.json, right arm, native frame",
          acromionRadiale,
          receipt: forearm,
        },
        null,
        2,
      ),
    );
    console.log(typeof forearm === "string" ? `forearm: ${forearm}` : JSON.stringify(forearm));
  }

  /** The upper arm's own axis: elbow break and unit direction up the arm. */
  interface IAxis {
    elbow: V3;
    up: V3;
  }

  /** One plane's reading. */
  interface ILevel {
    /** Distance above the elbow break along the upper arm axis, mm. */
    distance: number;

    /** Section points of the loop around the axis. */
    points: number;

    /** Greatest distance of the loop from the axis, mm. */
    reach: number;

    /** Convex hull perimeter of the loop, mm. */
    hull: number;
  }

  /** Slice centroids along the principal axis; the two-chord break above the narrowest forearm slice. */
  function upperAxis(points: V3[]): IAxis {
    const mean: V3 = scale(points.reduce((a: V3, b: V3): V3 => add(a, b), [0, 0, 0]), 1 / points.length);
    let axis: V3 = unit(sub(points.reduce((a: V3, b: V3): V3 => (b[1] > a[1] ? b : a)), points.reduce((a: V3, b: V3): V3 => (b[1] < a[1] ? b : a))));
    for (let k: number = 0; k < 20; ++k) {
      let next: V3 = [0, 0, 0];
      for (const p of points) next = add(next, scale(sub(p, mean), dot(sub(p, mean), axis)));
      axis = unit(next);
    }
    if (axis[1] < 0) axis = scale(axis, -1);
    const ts: number[] = points.map((p: V3): number => -dot(sub(p, mean), axis));
    const lo: number = Math.min(...ts);
    const hi: number = Math.max(...ts);
    const n: number = 60;
    const bins: V3[][] = Array.from({ length: n }, (): V3[] => []);
    points.forEach((p: V3, i: number): void => {
      bins[Math.min(n - 1, Math.floor(((ts[i]! - lo) / (hi - lo)) * n))]!.push(p);
    });
    const c: V3[] = bins.map((b: V3[]): V3 => (b.length === 0 ? [NaN, NaN, NaN] : scale(b.reduce((a: V3, x: V3): V3 => add(a, x), [0, 0, 0]), 1 / b.length)));
    const r: number[] = bins.map((b: V3[], k: number): number => (b.length === 0 ? Infinity : b.reduce((s: number, p: V3): number => s + Math.hypot(...sub(p, c[k]!)), 0) / b.length));
    const counts: number[] = bins.map((b: V3[]): number => b.length).sort((a: number, b: number): number => a - b);
    let wrist: number = Math.floor(0.6 * n);
    for (let k: number = Math.floor(0.45 * n); k <= Math.floor(0.85 * n); ++k) if (bins[k]!.length >= counts[Math.floor(n / 2)]! / 2 && r[k]! < r[wrist]!) wrist = k;
    const chord: (a: number, b: number) => number = (a: number, b: number): number => {
      let s: number = 0;
      const d: V3 = unit(sub(c[b]!, c[a]!));
      for (let i: number = a; i <= b; ++i) {
        if (bins[i]!.length === 0) continue;
        const w: V3 = sub(c[i]!, c[a]!);
        s += Math.hypot(...sub(w, scale(d, dot(w, d))));
      }
      return s;
    };
    let elbow: number = 3;
    let best: number = Infinity;
    for (let b: number = 3; b < wrist - 3; ++b) {
      if (bins[b]!.length === 0) continue;
      const s: number = chord(0, b) + chord(b, wrist);
      if (s < best) [best, elbow] = [s, b];
    }
    return { elbow: c[elbow]!, up: unit(sub(c[0]!, c[elbow]!)) };
  }

  /** Cut the mesh by the plane through `origin` normal to `normal`; read the loop around the axis point. */
  function cut(positions: V3[], triangles: [number, number, number][], origin: V3, normal: V3, distance: number): ILevel {
    const e1: V3 = unit(cross(normal, Math.abs(normal[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1]));
    const e2: V3 = cross(normal, e1);
    const side: (i: number) => number = (i: number): number => dot(sub(positions[i]!, origin), normal);
    const ids: Map<string, number> = new Map();
    const pts: [number, number][] = [];
    const parent: number[] = [];
    const find: (x: number) => number = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x]!)));
    const vertex: (a: number, b: number) => number = (a: number, b: number): number => {
      const key: string = a < b ? `${a}:${b}` : `${b}:${a}`;
      const known: number | undefined = ids.get(key);
      if (known !== undefined) return known;
      const da: number = side(a);
      const db: number = side(b);
      const t: number = da / (da - db);
      const p: V3 = add(positions[a]!, scale(sub(positions[b]!, positions[a]!), t));
      const w: V3 = sub(p, origin);
      pts.push([dot(w, e1), dot(w, e2)]);
      parent.push(pts.length - 1);
      ids.set(key, pts.length - 1);
      return pts.length - 1;
    };
    for (const [a, b, c] of triangles) {
      const s: number[] = [side(a), side(b), side(c)];
      const crossing: [number, number][] = ([[a, b], [b, c], [c, a]] as [number, number][]).filter((_: [number, number], k: number): boolean => s[k]! * s[(k + 1) % 3]! < 0);
      if (crossing.length !== 2) continue;
      const u: number = vertex(crossing[0]![0], crossing[0]![1]);
      const v: number = vertex(crossing[1]![0], crossing[1]![1]);
      parent[find(u)] = find(v);
    }
    // The loop around the axis: the component holding the section point nearest the axis.
    if (pts.length === 0) return { distance, points: 0, reach: 0, hull: 0 };
    let nearest: number = 0;
    pts.forEach((p: [number, number], k: number): void => {
      if (Math.hypot(...p) < Math.hypot(...pts[nearest]!)) nearest = k;
    });
    const root: number = find(nearest);
    const loop: [number, number][] = pts.filter((_: [number, number], k: number): boolean => find(k) === root);
    return { distance, points: loop.length, reach: Math.max(...loop.map((p: [number, number]): number => Math.hypot(...p))), hull: hull(loop) };
  }

  /** Convex hull perimeter (Andrew's monotone chain). */
  function hull(points: [number, number][]): number {
    if (points.length < 3) return 0;
    const p: [number, number][] = [...points].sort((a: [number, number], b: [number, number]): number => a[0] - b[0] || a[1] - b[1]);
    const turn: (o: [number, number], a: [number, number], b: [number, number]) => number = (o: [number, number], a: [number, number], b: [number, number]): number =>
      (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half: (list: [number, number][]) => [number, number][] = (list: [number, number][]): [number, number][] => {
      const out: [number, number][] = [];
      for (const q of list) {
        while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, q) <= 0) out.pop();
        out.push(q);
      }
      out.pop();
      return out;
    };
    const h: [number, number][] = [...half(p), ...half([...p].reverse())];
    let sum: number = 0;
    for (let k: number = 0; k < h.length; ++k) sum += Math.hypot(h[(k + 1) % h.length]![0] - h[k]![0], h[(k + 1) % h.length]![1] - h[k]![1]);
    return sum;
  }

  function add(a: V3, b: V3): V3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function scale(a: V3, s: number): V3 {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  function unit(a: V3): V3 {
    const n: number = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / n, a[1] / n, a[2] / n];
  }
}

void NodeArmMeasure.run().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
