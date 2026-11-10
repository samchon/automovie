import { AutoMovieLoftChain } from "../../../packages/engine/src/geometry/construction/AutoMovieLoftChain";
import type { NodeCanvasTypes as N } from "../../../packages/human/src/inspection/NodeCanvasTypes";
import type { PartConicTypes as T } from "./PartConicTypes";
import type { PartConicFields as F } from "./PartConicFields";
import { PartConicInput as I } from "./PartConicInput";
import { PartConicProfile as P } from "./PartConicProfile";
import { ConicPaperInput as C } from "./ConicPaperInput";

/** One common station/phase display grid separates family geometry from triangulation and seam-search effects. */
export namespace PartConicGeometry {
  /** Actual display geometry and the unchanged physical millimetre grid used for derivative comparison. */
  export interface Scene {
    /** Source or coefficient producer, never a hidden mesh fallback. */
    name: string;
    /** Metre positions for the CPU diagnostic renderer. */
    mesh: N.Mesh;
    /** Actual evaluated section construction in metres. */
    curves: N.Curve[];
    /** Ordered physical station/phase points in millimetres. */
    grid: T.V[][];
  }
  /** Build a common-grid mesh from one existing point owner, with identical triangle indices for every compared family. */
  export function grid(part: T.Part, name: string, point: (s: number, phi: number, row: number) => T.V): Scene {
    const values: T.V[][] = part.rows.map((row: T.Row, i: number): T.V[] => Array.from({ length: 128 }, (_: unknown, j: number): T.V => point(row.s, j * 2 * Math.PI / 128, i)));
    const positions: number[] = []; const indices: number[] = [];
    for (const ring of values) for (const p of ring) positions.push(p[0] / 1000, p[1] / 1000, p[2] / 1000);
    for (let i: number = 0; i + 1 < values.length; ++i) for (let j: number = 0; j < 128; ++j) {
      const a: number = i * 128 + j; const b: number = i * 128 + (j + 1) % 128;
      indices.push(a, a + 128, b, b, a + 128, b + 128);
    }
    return { name, mesh: { id: part.name + "." + name, positions, indices, colour: [0.64, 0.65, 0.67] },
      curves: values.map((ring: T.V[], i: number): N.Curve => ({ id: name + ".section." + i, points: ring.map((p: T.V): N.Point => [p[0] / 1000, p[1] / 1000, p[2] / 1000]), closed: true, colour: name.includes("conic") ? "b84b29" : "2268a2" })), grid: values };
  }
  /** Evaluate the actual engine conic loft; no native coordinates supply its skin. */
  export function generated(part: T.Part, result: F.Result): Scene {
    const chain: NonNullable<F.Result["loft"]["chain"]> = result.loft.chain!;
    return grid(part, "continuous-conic-" + result.coefficients.piecesPerQuarter * 4, (s: number, phi: number): T.V => AutoMovieLoftChain.point(chain, s, phi));
  }
  /** Native cuts are an observation-only differential baseline, never a generated-conic fallback. */
  export function nativeGrid(part: T.Part): Scene { return grid(part, "native-cut-control", (s: number, phi: number, row: number): T.V => world(part, s, P.radius(part.rows[row]!.points, phi), phi)); }
  /** Re-evaluate saved cubic coefficients in their actual plane; midpoint rows use the same explicit ruled phase correspondence. */
  export function saved(part: T.Part): Scene {
    const training: { s: number; points: T.P[] }[] = part.rows.filter((row: T.Row): boolean => !row.heldout).map((row: T.Row): { s: number; points: T.P[] } => {
      if (row.saved === undefined) throw new Error("Selected source station has no saved cubic authority.");
      const origin: T.V = I.sub([0, 0, 0], I.scale(part.n, -row.s));
      const center: T.V = [part.origin[0] + origin[0], part.origin[1] + origin[1], part.origin[2] + origin[2]];
      const points: T.P[] = [];
      for (const span of row.saved.spans) {
        const projected: C.Span = span.map((p): T.V => { const d: T.V = I.sub([p[0], p[1], p[2]], center); return [I.dot(d, part.u), 0, I.dot(d, part.v)]; }) as unknown as C.Span;
        for (let k: number = 0; k < 8; ++k) { const p = C.value(projected, k / 8, 0); points.push([p[0], p[1]]); }
      }
      return { s: row.s, points };
    });
    return grid(part, "saved-family-common-phase", (s: number, phi: number): T.V => {
      let i: number = 0; while (i + 2 < training.length && training[i + 1]!.s < s) ++i;
      const a = training[i]!; const b = training[i + 1]!;
      const t: number = (s - a.s) / (b.s - a.s);
      return world(part, s, (1 - t) * P.radius(a.points, phi) + t * P.radius(b.points, phi), phi);
    });
  }
  /** Clip the separately labelled native reference to the exact oriented study box, without caps or coordinate fitting. */
  export function reference(part: T.Part, mesh: T.Input["mesh"]): N.Mesh {
    const low: T.V = [Infinity, Infinity, part.domain[0]]; const high: T.V = [-Infinity, -Infinity, part.domain[1]];
    for (const row of part.rows) for (const p of row.points) for (let k: number = 0; k < 2; ++k) { low[k] = Math.min(low[k]!, p[k]! - 2); high[k] = Math.max(high[k]!, p[k]! + 2); }
    const positions: number[] = []; const indices: number[] = [];
    const aliases: Map<string, number> = new Map();
    const read = (index: number): T.V => [mesh.positions[index * 3]!, mesh.positions[index * 3 + 1]!, mesh.positions[index * 3 + 2]!];
    const coordinate = (p: T.V, axis: number): number => I.dot(I.sub(p, part.origin), [part.u, part.v, part.n][axis]!);
    for (let i: number = 0; i < mesh.indices.length; i += 3) {
      let polygon: T.V[] = [read(mesh.indices[i]!), read(mesh.indices[i + 1]!), read(mesh.indices[i + 2]!)];
      for (let axis: number = 0; axis < 3 && polygon.length > 0; ++axis) for (const side of [0, 1]) {
        const limit: number = side === 0 ? low[axis]! : high[axis]!;
        const next: T.V[] = [];
        for (let j: number = 0; j < polygon.length; ++j) {
          const a: T.V = polygon[j]!; const b: T.V = polygon[(j + 1) % polygon.length]!;
          const da: number = (coordinate(a, axis) - limit) * (side === 0 ? 1 : -1);
          const db: number = (coordinate(b, axis) - limit) * (side === 0 ? 1 : -1);
          if (da >= 0) next.push(a);
          if ((da >= 0) !== (db >= 0)) { const t: number = da / (da - db); next.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])]); }
        }
        polygon = next;
      }
      // Preserve exact positional adjacency for the GPU normal owner. A
      // triangle soup would force flat native normals even when the common
      // material requests smooth shading. Exact aliases change only indices;
      // no tolerance weld, moved point or fabricated cap is introduced.
      for (let j: number = 1; j + 1 < polygon.length; ++j) for (const p of [polygon[0]!, polygon[j]!, polygon[j + 1]!]) {
        const key: string = p.join(","); let at: number | undefined = aliases.get(key);
        if (at === undefined) { at = positions.length / 3; aliases.set(key, at); positions.push(p[0] / 1000, p[1] / 1000, p[2] / 1000); }
        indices.push(at);
      }
    }
    return { id: part.name + ".native-reference-clipped", positions, indices, colour: [0.64, 0.65, 0.67] };
  }
  /** Same-grid physical first/second differences expose family normals and curvature independently of flat shading. */
  export function quality(part: T.Part, scene: Scene, native: Scene): { pointMaximumMm: number; normalP95Degrees: number; normalMaximumDegrees: number; meanCurvatureAbsP95PerMm: number; meanCurvatureAbsMaximumPerMm: number; meanCurvatureErrorP95PerMm: number; meanCurvatureErrorMaximumPerMm: number; inwardNormals: number; nonregularSamples: number; minimumStationGapMm: number } {
    const normalErrors: number[] = []; const curvature: number[] = []; const curvatureErrors: number[] = [];
    let maximum: number = 0; let inward: number = 0; let nonregular: number = 0;
    const delta: number = 2 * Math.PI / 128;
    const sample = (grid: T.V[][], i: number, j: number): { normal: T.V; h: number } | null => {
      const p: T.V = grid[i]![j]!; const prev: T.V = grid[i - 1]![j]!; const next: T.V = grid[i + 1]![j]!;
      const a: T.V = grid[i]![(j + 127) % 128]!; const b: T.V = grid[i]![(j + 1) % 128]!;
      const left: number = part.rows[i]!.s - part.rows[i - 1]!.s; const right: number = part.rows[i + 1]!.s - part.rows[i]!.s;
      const su: T.V = I.scale(I.sub(next, prev), 1 / (left + right)); const sv: T.V = I.scale(I.sub(b, a), 1 / (2 * delta));
      const cross: T.V = I.cross(su, sv); const size: number = Math.hypot(...cross);
      if (!(size > 1e-12)) return null;
      const n: T.V = I.scale(cross, 1 / size);
      const ss: T.V = I.scale(I.sub(I.scale(I.sub(next, p), 1 / right), I.scale(I.sub(p, prev), 1 / left)), 2 / (left + right));
      const tt: T.V = I.scale(I.sub(I.sub(b, p), I.sub(p, a)), 1 / (delta * delta));
      const st: T.V = I.scale(I.sub(I.sub(grid[i + 1]![(j + 1) % 128]!, grid[i + 1]![(j + 127) % 128]!), I.sub(grid[i - 1]![(j + 1) % 128]!, grid[i - 1]![(j + 127) % 128]!)), 1 / ((left + right) * 2 * delta));
      const E: number = I.dot(su, su); const F: number = I.dot(su, sv); const G: number = I.dot(sv, sv);
      return { normal: n, h: (I.dot(n, ss) * G - 2 * I.dot(n, st) * F + I.dot(n, tt) * E) / (2 * (E * G - F * F)) };
    };
    for (let i: number = 0; i < scene.grid.length; ++i) for (let j: number = 0; j < 128; ++j) {
      maximum = Math.max(maximum, Math.hypot(...I.sub(scene.grid[i]![j]!, native.grid[i]![j]!)));
      if (i === 0 || i + 1 === scene.grid.length) continue;
      const a = sample(scene.grid, i, j); const b = sample(native.grid, i, j);
      if (a === null || b === null) { ++nonregular; continue; }
      normalErrors.push(Math.acos(Math.max(-1, Math.min(1, I.dot(a.normal, b.normal)))) * 180 / Math.PI);
      curvature.push(Math.abs(a.h));
      curvatureErrors.push(Math.abs(a.h - b.h));
      const center: T.V = [part.origin[0] + part.n[0] * part.rows[i]!.s, part.origin[1] + part.n[1] * part.rows[i]!.s, part.origin[2] + part.n[2] * part.rows[i]!.s];
      if (I.dot(a.normal, I.sub(scene.grid[i]![j]!, center)) <= 0) ++inward;
    }
    normalErrors.sort((a: number, b: number): number => a - b); curvature.sort((a: number, b: number): number => a - b); curvatureErrors.sort((a: number, b: number): number => a - b);
    return { pointMaximumMm: maximum, normalP95Degrees: normalErrors[Math.floor(normalErrors.length * 0.95)] ?? Infinity, normalMaximumDegrees: normalErrors.at(-1) ?? Infinity,
      meanCurvatureAbsP95PerMm: curvature[Math.floor(curvature.length * 0.95)] ?? Infinity, meanCurvatureAbsMaximumPerMm: curvature.at(-1) ?? Infinity, inwardNormals: inward, nonregularSamples: nonregular,
      meanCurvatureErrorP95PerMm: curvatureErrors[Math.floor(curvatureErrors.length * 0.95)] ?? Infinity, meanCurvatureErrorMaximumPerMm: curvatureErrors.at(-1) ?? Infinity,
      minimumStationGapMm: Math.min(...part.rows.slice(1).map((row: T.Row, i: number): number => row.s - part.rows[i]!.s)) };
  }
  /** Carry a polar section point back through the original absolute frame exactly once. */
  function world(part: T.Part, s: number, r: number, phi: number): T.V { const a: number = r * Math.cos(phi); const b: number = r * Math.sin(phi); return [0, 1, 2].map((k: number): number => part.origin[k]! + part.n[k]! * s + part.u[k]! * a + part.v[k]! * b) as T.V; }
}
