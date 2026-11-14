/**
 * The signed distance from a point to the nearest triangle of the reference skin, the one measure the whole-figure gate
 * (`FamilyConicDeviation.ts`) and the knot-flow check (`FamilyConicFlow.ts`) both read, so the tool that proposes a change and the gate
 * that judges it measure the same thing.
 *
 * The reference triangles are filed by every cell of a grid their box touches; a point's distance is searched over the cells round its own,
 * ring by ring, and signed by the nearest triangle's side.
 */
export namespace FamilyConicNearest {
  /** A point or a direction, mm. */
  export type V3 = [number, number, number];

  /** Edge of the cells the reference triangles are filed in, mm. */
  export const CELL_MM: number = 12;

  /** The reference triangles and the cells they are filed in. */
  export interface IGrid {
    /** Every triangle's corners, mm. */
    triangles: [V3, V3, V3][];

    /** The triangles by cell, the cell keyed by its integer coordinates. */
    cells: Map<string, number[]>;
  }

  const key = (i: number, j: number, k: number): string => i + "," + j + "," + k;

  /**
   * The reference triangles, filed by every cell their box touches.
   *
   * @param meshes The reference skins, positions in mm.
   */
  export function grid(meshes: readonly { positions: ArrayLike<number>; indices: ArrayLike<number> }[]): IGrid {
    const triangles: [V3, V3, V3][] = [];
    for (const mesh of meshes)
      for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) triangles.push([0, 1, 2].map((k: number): V3 => [mesh.positions[mesh.indices[t + k]! * 3]!, mesh.positions[mesh.indices[t + k]! * 3 + 1]!, mesh.positions[mesh.indices[t + k]! * 3 + 2]!]) as [V3, V3, V3]);
    const cells: Map<string, number[]> = new Map();
    triangles.forEach((corners: [V3, V3, V3], index: number): void => {
      const low: number[] = [0, 1, 2].map((c: number): number => Math.floor(Math.min(...corners.map((p: V3): number => p[c]!)) / CELL_MM));
      const high: number[] = [0, 1, 2].map((c: number): number => Math.floor(Math.max(...corners.map((p: V3): number => p[c]!)) / CELL_MM));
      for (let i: number = low[0]!; i <= high[0]!; ++i)
        for (let j: number = low[1]!; j <= high[1]!; ++j)
          for (let k: number = low[2]!; k <= high[2]!; ++k) {
            const id: string = key(i, j, k);
            const list: number[] | undefined = cells.get(id);
            if (list === undefined) cells.set(id, [index]);
            else list.push(index);
          }
    });
    return { triangles, cells };
  }

  /**
   * Signed distance from a point to the nearest reference triangle within four cells, mm: positive on the side the triangle's normal
   * faces (outside the skin), negative inside; null when none is that near.
   *
   * @param grid The filed reference triangles.
   * @param p The point, mm.
   */
  export function distance(grid: IGrid, p: V3): number | null {
    const home: number[] = p.map((x: number): number => Math.floor(x / CELL_MM));
    let best: number = Infinity;
    let signed: number | null = null;
    const seen: Set<number> = new Set();
    for (let ring: number = 1; ring <= 4 && best > (ring - 1) * CELL_MM; ++ring)
      for (let i: number = -ring; i <= ring; ++i)
        for (let j: number = -ring; j <= ring; ++j)
          for (let k: number = -ring; k <= ring; ++k) {
            if (Math.max(Math.abs(i), Math.abs(j), Math.abs(k)) !== ring && ring > 1) continue;
            for (const index of grid.cells.get(key(home[0]! + i, home[1]! + j, home[2]! + k)) ?? []) {
              if (seen.has(index)) continue;
              seen.add(index);
              const [a, b, c]: [V3, V3, V3] = grid.triangles[index]!;
              const q: V3 = closest(p, a, b, c);
              const d: number = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
              if (d < best) {
                best = d;
                const n: V3 = cross(sub(b, a), sub(c, a));
                signed = dot(sub(p, q), n) >= 0 ? d : -d;
              }
            }
          }
    return signed;
  }

  /** The difference `a - b`. */
  export function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** The dot product of `a` and `b`. */
  export function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** The cross product `a x b`. */
  export function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /** The point of triangle `abc` nearest `p`, by the regions of its corners, edges and face (Ericson, Real-Time Collision Detection, 5.1.5). */
  export function closest(p: V3, a: V3, b: V3, c: V3): V3 {
    const ab: V3 = sub(b, a);
    const ac: V3 = sub(c, a);
    const ap: V3 = sub(p, a);
    const d1: number = dot(ab, ap);
    const d2: number = dot(ac, ap);
    if (d1 <= 0 && d2 <= 0) return a;
    const bp: V3 = sub(p, b);
    const d3: number = dot(ab, bp);
    const d4: number = dot(ac, bp);
    if (d3 >= 0 && d4 <= d3) return b;
    const vc: number = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      const v: number = d1 / (d1 - d3);
      return [a[0] + v * ab[0], a[1] + v * ab[1], a[2] + v * ab[2]];
    }
    const cp: V3 = sub(p, c);
    const d5: number = dot(ab, cp);
    const d6: number = dot(ac, cp);
    if (d6 >= 0 && d5 <= d6) return c;
    const vb: number = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      const w: number = d2 / (d2 - d6);
      return [a[0] + w * ac[0], a[1] + w * ac[1], a[2] + w * ac[2]];
    }
    const va: number = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
      const w: number = (d4 - d3) / (d4 - d3 + (d5 - d6));
      return [b[0] + w * (c[0] - b[0]), b[1] + w * (c[1] - b[1]), b[2] + w * (c[2] - b[2])];
    }
    const denominator: number = 1 / (va + vb + vc);
    const v: number = vb * denominator;
    const w: number = vc * denominator;
    return [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w];
  }
}
