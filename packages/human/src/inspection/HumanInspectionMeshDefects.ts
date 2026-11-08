/**
 * Universal defect detectors of a triangle mesh, whatever made it: open
 * edges, non-manifold edges, neighbours wound against each other, an inside-out
 * closed surface, sliver and degenerate triangles, and skin that passes
 * through itself. Each reads only positions and indices.
 */
export namespace HumanInspectionMeshDefects {
  /** A triangle mesh: flat xyz positions and three indices per triangle. */
  export interface IMesh {
    /** Flat positions, three numbers per vertex. */
    positions: ArrayLike<number>;

    /** Flat triangle indices, three per triangle. */
    indices: ArrayLike<number>;
  }

  /** One edge defect: its two vertices and how many triangles use it, and in which directions. */
  export interface IEdgeFinding {
    /** "open" (one triangle), "non-manifold" (more than two) or "inconsistent" (two triangles traverse it the same way). */
    kind: "open" | "non-manifold" | "inconsistent";

    /** The edge's vertices, smaller index first. */
    edge: [number, number];

    /** Triangles using the edge. */
    triangles: number[];
  }

  /** One triangle-quality defect. */
  export interface ITriangleFinding {
    /** "degenerate" (no area) or "sliver" (aspect over the limit). */
    kind: "degenerate" | "sliver";

    /** Triangle index. */
    triangle: number;

    /** Aspect `L^2 sqrt(3) / (4 A)` with L the longest edge: 1 for an equilateral triangle; Infinity when degenerate. */
    aspect: number;
  }

  /** One pair of triangles sharing no vertex whose surfaces cross. */
  export interface ICrossing {
    /** The two triangle indices. */
    triangles: [number, number];
  }

  type V3 = [number, number, number];

  /**
   * Every open, non-manifold or inconsistently wound edge. A closed,
   * orientable, consistently wound skin has none: each edge is used by
   * exactly two triangles, once in each direction.
   *
   * @param mesh The mesh.
   * @param boundary Edges allowed to be open (declared free ends), as "a,b" keys with a < b.
   */
  export function edges(mesh: IMesh, boundary: ReadonlySet<string> = new Set<string>()): IEdgeFinding[] {
    const uses: Map<string, { triangles: number[]; forward: number }> = new Map();
    const count: number = Math.floor(mesh.indices.length / 3);
    for (let t: number = 0; t < count; ++t)
      for (let k: number = 0; k < 3; ++k) {
        const a: number = mesh.indices[3 * t + k]!;
        const b: number = mesh.indices[3 * t + ((k + 1) % 3)]!;
        const key: string = a < b ? `${a},${b}` : `${b},${a}`;
        const use: { triangles: number[]; forward: number } = uses.get(key) ?? { triangles: [], forward: 0 };
        use.triangles.push(t);
        if (a < b) use.forward += 1;
        uses.set(key, use);
      }
    const out: IEdgeFinding[] = [];
    for (const [key, use] of uses) {
      const edge: [number, number] = key.split(",").map(Number) as [number, number];
      if (use.triangles.length === 1) {
        if (!boundary.has(key)) out.push({ kind: "open", edge, triangles: use.triangles });
      } else if (use.triangles.length > 2) out.push({ kind: "non-manifold", edge, triangles: use.triangles });
      else if (use.forward !== 1) out.push({ kind: "inconsistent", edge, triangles: use.triangles });
    }
    return out;
  }

  /**
   * The signed volume a closed mesh encloses, by the divergence theorem over
   * its triangles: positive when the triangles wind counter-clockwise seen
   * from outside (normals outward), negative when the skin is inside out.
   *
   * @param mesh The mesh.
   */
  export function volume(mesh: IMesh): number {
    let sum: number = 0;
    const count: number = Math.floor(mesh.indices.length / 3);
    for (let t: number = 0; t < count; ++t) {
      const [a, b, c] = corners(mesh, t);
      sum += a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
    }
    return sum / 6;
  }

  /**
   * Every degenerate triangle and every triangle whose aspect exceeds the
   * limit.
   *
   * @param mesh The mesh.
   * @param limit Largest admitted aspect; 1 is equilateral.
   */
  export function triangles(mesh: IMesh, limit: number): ITriangleFinding[] {
    const out: ITriangleFinding[] = [];
    const count: number = Math.floor(mesh.indices.length / 3);
    for (let t: number = 0; t < count; ++t) {
      const [a, b, c] = corners(mesh, t);
      const area: number = norm(cross(sub(b, a), sub(c, a))) / 2;
      const longest: number = Math.max(norm(sub(b, a)), norm(sub(c, b)), norm(sub(a, c)));
      if (!(area > 1e-12 * Math.max(longest * longest, 1e-300))) out.push({ kind: "degenerate", triangle: t, aspect: Infinity });
      else {
        const aspect: number = (longest * longest * Math.sqrt(3)) / (4 * area);
        if (aspect > limit) out.push({ kind: "sliver", triangle: t, aspect });
      }
    }
    return out;
  }

  /**
   * Every pair of triangles that share no vertex and whose surfaces cross:
   * an edge of one passes through the interior of the other. Candidate pairs
   * come from a uniform grid of the triangles' bounding boxes; each pair is
   * tested in one cell only, the cell holding the low corner of the two
   * boxes' overlap, so no pair is remembered and the work stays per cell.
   *
   * @param mesh The mesh.
   * @param limit Most crossings to return; the search stops there.
   */
  export function crossings(mesh: IMesh, limit: number = Infinity): ICrossing[] {
    const count: number = Math.floor(mesh.indices.length / 3);
    if (count === 0) return [];
    const boxes: { lo: V3; hi: V3 }[] = [];
    let span: number = 0;
    for (let t: number = 0; t < count; ++t) {
      const [a, b, c] = corners(mesh, t);
      const lo: V3 = [Math.min(a[0], b[0], c[0]), Math.min(a[1], b[1], c[1]), Math.min(a[2], b[2], c[2])];
      const hi: V3 = [Math.max(a[0], b[0], c[0]), Math.max(a[1], b[1], c[1]), Math.max(a[2], b[2], c[2])];
      boxes.push({ lo, hi });
      span += Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);
    }
    const cell: number = Math.max(span / count, 1e-9);
    const grid: Map<string, number[]> = new Map();
    for (let t: number = 0; t < count; ++t) {
      const { lo, hi } = boxes[t]!;
      for (let i: number = Math.floor(lo[0] / cell); i <= Math.floor(hi[0] / cell); ++i)
        for (let j: number = Math.floor(lo[1] / cell); j <= Math.floor(hi[1] / cell); ++j)
          for (let k: number = Math.floor(lo[2] / cell); k <= Math.floor(hi[2] / cell); ++k) {
            const key: string = `${i},${j},${k}`;
            const list: number[] = grid.get(key) ?? [];
            list.push(t);
            grid.set(key, list);
          }
    }
    const out: ICrossing[] = [];
    for (const [key, list] of grid) {
      const [i, j, k] = key.split(",").map(Number) as [number, number, number];
      for (let p: number = 0; p < list.length; ++p)
        for (let q: number = p + 1; q < list.length; ++q) {
          const s: number = Math.min(list[p]!, list[q]!);
          const t: number = Math.max(list[p]!, list[q]!);
          const a: { lo: V3; hi: V3 } = boxes[s]!;
          const b: { lo: V3; hi: V3 } = boxes[t]!;
          if (!overlap(a, b)) continue;
          // Test the pair only in the cell holding its overlap's low corner.
          if (
            Math.floor(Math.max(a.lo[0], b.lo[0]) / cell) !== i ||
            Math.floor(Math.max(a.lo[1], b.lo[1]) / cell) !== j ||
            Math.floor(Math.max(a.lo[2], b.lo[2]) / cell) !== k
          )
            continue;
          if (sharesVertex(mesh, s, t)) continue;
          if (cuts(mesh, s, t) || cuts(mesh, t, s)) {
            out.push({ triangles: [s, t] });
            if (out.length >= limit) return out;
          }
        }
    }
    return out;
  }

  /** The three corners of a triangle. */
  function corners(mesh: IMesh, t: number): [V3, V3, V3] {
    const at: (k: number) => V3 = (k: number): V3 => {
      const v: number = mesh.indices[3 * t + k]!;
      return [mesh.positions[3 * v]!, mesh.positions[3 * v + 1]!, mesh.positions[3 * v + 2]!];
    };
    return [at(0), at(1), at(2)];
  }

  /** Whether two triangles share a vertex index. */
  function sharesVertex(mesh: IMesh, s: number, t: number): boolean {
    for (let i: number = 0; i < 3; ++i) for (let j: number = 0; j < 3; ++j) if (mesh.indices[3 * s + i] === mesh.indices[3 * t + j]) return true;
    return false;
  }

  /** Whether two boxes overlap. */
  function overlap(a: { lo: V3; hi: V3 }, b: { lo: V3; hi: V3 }): boolean {
    return a.lo[0] <= b.hi[0] && b.lo[0] <= a.hi[0] && a.lo[1] <= b.hi[1] && b.lo[1] <= a.hi[1] && a.lo[2] <= b.hi[2] && b.lo[2] <= a.hi[2];
  }

  /** Whether an edge of triangle s passes through the interior of triangle t (Moller-Trumbore, strict). */
  function cuts(mesh: IMesh, s: number, t: number): boolean {
    const p: [V3, V3, V3] = corners(mesh, s);
    const [a, b, c] = corners(mesh, t);
    const e1: V3 = sub(b, a);
    const e2: V3 = sub(c, a);
    for (let k: number = 0; k < 3; ++k) {
      const o: V3 = p[k]!;
      const d: V3 = sub(p[(k + 1) % 3]!, o);
      const h: V3 = cross(d, e2);
      const det: number = dot(e1, h);
      if (Math.abs(det) < 1e-14 * Math.max(norm(d) * norm(e1) * norm(e2), 1e-300)) continue;
      const f: number = 1 / det;
      const w: V3 = sub(o, a);
      const u: number = f * dot(w, h);
      if (!(u > 1e-12 && u < 1 - 1e-12)) continue;
      const q: V3 = cross(w, e1);
      const v: number = f * dot(d, q);
      if (!(v > 1e-12 && u + v < 1 - 1e-12)) continue;
      const along: number = f * dot(e2, q);
      if (along > 1e-12 && along < 1 - 1e-12) return true;
    }
    return false;
  }

  function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function norm(a: V3): number {
    return Math.hypot(a[0], a[1], a[2]);
  }
}
