import fs from "node:fs";
import type { IAutoMovieModel } from "@automovie/interface";
import type { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { HumanInspectionReferenceMesh } from "../inspection/HumanInspectionReferenceMesh";
import { HumanNodePaths } from "./HumanNodePaths";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The reference trunk for the trunk renderer's diagnostic overlay
 * (`node:trunk-specs`), read and registered into the trunk's world frame for
 * comparison only; nothing here feeds generation. Its readings are exact
 * plane cuts of the reference triangles (a sagittal cut for the midlines,
 * horizontal cuts at the trunk's own levels), not vertex samples.
 */
export namespace NodeTrunkReference {
  /** The reference mesh in calibration mm and ISB world axes. */
  export interface IMesh {
    /** Vertices. */
    points: V3[];

    /** Triangles as vertex index triples. */
    triangles: [number, number, number][];
  }

  /** The registered reference and the registration's own measurements. */
  export interface IRegistered {
    /** Registered mesh. */
    mesh: IMesh;

    /** Trunk-region vertices only (arms and legs removed per height slab), for display. */
    trunk: V3[];

    /** Front (max X) and back (min X) of the registered mid-sagittal cut, `[y, x]` per 2 mm. */
    midline: { front: [number, number][]; back: [number, number][] };

    /** Registration measures, calibration mm. */
    measures: Record<string, number>;
  }

  /**
   * The reference body's mesh in calibration mm and ISB world axes. The
   * native artifact is metres with +X forward, +Y up and +Z anatomical left;
   * ISB Z points to the subject's right, so Z is negated (which also
   * reverses the triangles' winding; only cuts are read).
   */
  export function load(scale: number): IMesh {
    return fromModel(JSON.parse(fs.readFileSync(HumanNodePaths.resolve("test/.shots/f1/reference-model.json"), "utf8")), scale);
  }

  /** The same conversion from an already parsed reference model. */
  export function fromModel(model: IAutoMovieModel, scale: number): IMesh {
    const points: V3[] = [];
    const triangles: [number, number, number][] = [];
    for (const part of HumanInspectionReferenceMesh(model).parts) {
      if (part.geometry.type !== "mesh") continue;
      const p: ArrayLike<number> = part.geometry.mesh.positions;
      const idx: ArrayLike<number> | null = part.geometry.mesh.indices;
      const base: number = points.length;
      for (let i: number = 0; i + 2 < p.length; i += 3) points.push([p[i]! * 1000 * scale, p[i + 1]! * 1000 * scale, -p[i + 2]! * 1000 * scale]);
      if (idx !== null) for (let i: number = 0; i + 2 < idx.length; i += 3) triangles.push([base + idx[i]!, base + idx[i + 1]!, base + idx[i + 2]!]);
    }
    return { points, triangles };
  }

  /**
   * Diagnostic registration by the reference's own thorax landmarks, read on
   * its mid-sagittal cut: the jugular notch is the deepest point (least X)
   * of the front cut within 70 mm of our suprasternale height, refused at the
   * window's edge; the back cut is read at our cervicale height (not a
   * detected landmark). The mesh is
   * translated along X and Z only, so its notch lies on our IJ in X and its
   * midline on Z = 0 (the median Z of the trunk vertices); heights keep their
   * own floor. The measures record each reference landmark against ours.
   */
  export function register(mesh: IMesh, ours: { ij: V3; c7: V3 }): IRegistered {
    const midZ: number = median(mesh.points.filter((p: V3): boolean => p[1] > ours.ij[1] - 400 && p[1] < ours.ij[1]).map((p: V3): number => p[2]));
    const sagittal: [V3, V3][] = cut(mesh, [0, 0, 1], midZ);
    const front0: [number, number][] = profile(sagittal, "front");
    const back0: [number, number][] = profile(sagittal, "back");
    const notch: [number, number] = deepest(front0, ours.ij[1], 70);

    // Cervicale is not an extreme of the back cut (the back keeps receding
    // below it into the kyphosis), so the reference back is read at our C7
    // height rather than detected.
    const cervicale: [number, number] = back0.reduce((a: [number, number], b: [number, number]): [number, number] => (Math.abs(b[0] - ours.c7[1]) < Math.abs(a[0] - ours.c7[1]) ? b : a));
    const dx: number = ours.ij[0] - notch[1];
    const placed: IMesh = { points: mesh.points.map((p: V3): V3 => [p[0] + dx, p[1], p[2] - midZ]), triangles: mesh.triangles };
    return {
      mesh: placed,
      trunk: central(placed.points),
      midline: { front: front0.map(([y, x]: [number, number]): [number, number] => [y, x + dx]), back: back0.map(([y, x]: [number, number]): [number, number] => [y, x + dx]) },
      measures: {
        referenceMidlineZ: midZ,
        referenceNotchY: notch[0],
        oursIJY: ours.ij[1],
        referenceBackReadAtY: cervicale[0],
        oursC7Y: ours.c7[1],
        referenceNotchToBackAtOurC7X: notch[1] - cervicale[1],
        oursIJToC7X: ours.ij[0] - ours.c7[0],
        translationX: dx,
      },
    };
  }

  /** One level reading of the registered reference. */
  export interface ILevel {
    /** Height, mm. */
    y: number;

    /** Most anterior X within 5 mm of the midline, mm. */
    front: number;

    /** Most posterior X within 5 mm of the midline, mm. */
    back: number;

    /** Most anterior X over the trunk loop, mm. */
    maxX: number;

    /** Most posterior X over the trunk loop, mm. */
    minX: number;

    /** Half-width of the trunk loop (|Z| up to the first gap over 12 mm), mm. */
    half: number;

    /** Convex-hull perimeter of the trunk loop's cut, the taut-tape reading, mm. */
    hull: number;
  }

  /** Level readings of the registered reference at the given heights, from its exact horizontal cuts. */
  export function levels(r: IRegistered, ys: readonly number[], hull: (points: readonly [number, number][]) => number): ILevel[] {
    return ys.map((y: number): ILevel => {
      const points: V3[] = cut(r.mesh, [0, 1, 0], y).flat();
      const byZ: V3[] = [...points].sort((a: V3, b: V3): number => Math.abs(a[2]) - Math.abs(b[2]));
      let half: number = 0;
      for (const p of byZ) {
        if (Math.abs(p[2]) - half > 12) break;
        half = Math.abs(p[2]);
      }
      const loop: V3[] = points.filter((p: V3): boolean => Math.abs(p[2]) <= half + 1e-9);
      const mid: V3[] = loop.filter((p: V3): boolean => Math.abs(p[2]) < 5);
      return {
        y,
        front: Math.max(...mid.map((p: V3): number => p[0])),
        back: Math.min(...mid.map((p: V3): number => p[0])),
        maxX: Math.max(...loop.map((p: V3): number => p[0])),
        minX: Math.min(...loop.map((p: V3): number => p[0])),
        half,
        hull: hull(loop.map((p: V3): [number, number] => [p[0], p[2]])),
      };
    });
  }

  /** Segments where the plane `dot(n, p) = d` cuts the mesh. */
  export function cut(mesh: IMesh, n: V3, d: number): [V3, V3][] {
    const out: [V3, V3][] = [];
    const s: number[] = mesh.points.map((p: V3): number => n[0] * p[0] + n[1] * p[1] + n[2] * p[2] - d);
    for (const t of mesh.triangles) {
      const hits: V3[] = [];
      for (let e: number = 0; e < 3; ++e) {
        const a: number = t[e]!;
        const b: number = t[(e + 1) % 3]!;
        const sa: number = s[a]!;
        const sb: number = s[b]!;
        if ((sa < 0 && sb >= 0) || (sa >= 0 && sb < 0)) {
          const f: number = sa / (sa - sb);
          const pa: V3 = mesh.points[a]!;
          const pb: V3 = mesh.points[b]!;
          hits.push([pa[0] + f * (pb[0] - pa[0]), pa[1] + f * (pb[1] - pa[1]), pa[2] + f * (pb[2] - pa[2])]);
        }
      }
      if (hits.length === 2) out.push([hits[0]!, hits[1]!]);
    }
    return out;
  }

  /** Front (max X) or back (min X) of a sagittal cut per 2 mm of height. */
  function profile(segments: [V3, V3][], side: "front" | "back"): [number, number][] {
    const bins: Map<number, number> = new Map();
    for (const [a, b] of segments)
      for (let k: number = 0; k <= 4; ++k) {
        const p: V3 = [a[0] + ((b[0] - a[0]) * k) / 4, a[1] + ((b[1] - a[1]) * k) / 4, 0];
        const key: number = Math.round(p[1] / 2);
        const v: number | undefined = bins.get(key);
        if (v === undefined || (side === "front" ? p[0] > v : p[0] < v)) bins.set(key, p[0]);
      }
    return [...bins.entries()].sort((a: [number, number], b: [number, number]): number => a[0] - b[0]).map(([key, x]: [number, number]): [number, number] => [key * 2, x]);
  }

  /** The row of least X within `window` mm of `y`; throws when it sits on the window's edge (no interior minimum). */
  function deepest(rows: [number, number][], y: number, window: number): [number, number] {
    const near: [number, number][] = rows.filter((r: [number, number]): boolean => Math.abs(r[0] - y) <= window);
    if (near.length === 0) throw new Error(`reference cut has no rows within ${window} mm of ${y.toFixed(1)}`);
    const best: [number, number] = near.reduce((a: [number, number], b: [number, number]): [number, number] => (b[1] < a[1] ? b : a));
    if (Math.abs(best[0] - y) > window - 4) throw new Error(`reference landmark near ${y.toFixed(1)} sits on the search window's edge (${best[0]})`);
    return best;
  }

  /**
   * The registered mesh's trunk triangles for a clay comparison (display
   * only): per 10 mm slab from `lo` to `hi`, the Z cluster containing the
   * midline (vertex gaps over 18 mm split clusters), a triangle kept when its
   * centroid lies in its slab's cluster; from 1150 to 1330, where the hanging
   * arms touch the chest and close the gap, also within 158 mm of the
   * midline (f1's trunk half breadth there stays under 150).
   */
  export function trunkTriangles(r: IRegistered, lo: number = 790, hi: number = 1470): [V3, V3, V3][] {
    const slabs: Map<number, number[]> = new Map();
    for (const p of r.mesh.points) {
      if (p[1] < lo || p[1] > hi) continue;
      const b: number = Math.floor(p[1] / 10);
      const list: number[] | undefined = slabs.get(b);
      if (list === undefined) slabs.set(b, [p[2]]);
      else list.push(p[2]);
    }
    const ranges: Map<number, [number, number]> = new Map();
    for (const [b, zs] of slabs) {
      zs.sort((a: number, c: number): number => a - c);
      let start: number = 0;
      for (let i: number = 1; i <= zs.length; ++i) {
        if (i < zs.length && zs[i]! - zs[i - 1]! <= 18) continue;
        if (zs[start]! <= 0 && zs[i - 1]! >= 0) ranges.set(b, [zs[start]!, zs[i - 1]!]);
        start = i;
      }
    }
    const out: [V3, V3, V3][] = [];
    for (const [a, b, c] of r.mesh.triangles) {
      const t: [V3, V3, V3] = [r.mesh.points[a]!, r.mesh.points[b]!, r.mesh.points[c]!];
      const y: number = (t[0][1] + t[1][1] + t[2][1]) / 3;
      const z: number = (t[0][2] + t[1][2] + t[2][2]) / 3;
      const range: [number, number] | undefined = ranges.get(Math.floor(y / 10));
      if (range === undefined || z < range[0] - 1 || z > range[1] + 1) continue;
      if (y > 1150 && y < 1330 && Math.abs(z) > 158) continue;
      out.push(t);
    }
    return out;
  }

  /** Per 10 mm slab, the Z cluster containing the midline (a display selection). */
  function central(points: V3[]): V3[] {
    const slabs: Map<number, V3[]> = new Map();
    for (const p of points) {
      if (p[1] < 650 || p[1] > 1560) continue;
      const b: number = Math.floor(p[1] / 10);
      const list: V3[] | undefined = slabs.get(b);
      if (list === undefined) slabs.set(b, [p]);
      else list.push(p);
    }
    const out: V3[] = [];
    for (const list of slabs.values()) {
      list.sort((a: V3, b: V3): number => a[2] - b[2]);
      let start: number = 0;
      for (let i: number = 1; i <= list.length; ++i) {
        if (i < list.length && list[i]![2] - list[i - 1]![2] <= 18) continue;
        if (list[start]![2] <= 0 && list[i - 1]![2] >= 0) for (let j: number = start; j < i; ++j) out.push(list[j]!);
        start = i;
      }
    }
    return out;
  }

  function median(values: number[]): number {
    if (values.length === 0) return 0;
    const s: number[] = [...values].sort((a: number, b: number): number => a - b);
    return s[Math.floor(s.length / 2)]!;
  }
}
