import type { AutoMovieHumanMandibularBorder as Border } from "./AutoMovieHumanMandibularBorder";

/** Physical closest-triangle query over an immutable emitted mandibular patch. */
export namespace AutoMovieHumanMandibularMeshField {
  /** Physical XYZ coordinates in the body frame, in millimetres. */
  type Point = Border.Point;

  /** Cached spatial query; authored source normals determine its local sign. */
  export interface IPrepared {
    /** Signed physical distance to the emitted patch; negative points inward. */
    field(x: number, y: number, z: number): number;
  }

  /**
   * Preserve the source's arithmetic, eight-triangle leaves and visitation ties.
   * Each row stores nine positions, six edge components and nine authored normals.
   * Build sorting costs O(T log-squared T), snapshot storage is O(T), and the
   * reusable DFS stack is O(log T). Triangle queries allocate no tuples. A query
   * visits O(T) triangles in the worst case. Rebuild after changing the source.
   * Callers must finish each synchronous query before
   * starting the next; no callback is called while the shared scratch is active.
   */
  export function prepare(vertices: Point[], triangles: [number, number, number][], normals: Point[]): IPrepared {
    const rows: Float64Array = new Float64Array(triangles.length * 24);
    for (let index: number = 0; index < triangles.length; index++) {
      const ids: [number, number, number] = triangles[index]!;
      const row: number = index * 24;
      for (let corner: number = 0; corner < 3; corner++) {
        for (let axis: number = 0; axis < 3; axis++) {
          rows[row + corner * 3 + axis] = vertices[ids[corner]!]![axis]!;
          rows[row + 15 + corner * 3 + axis] = normals[ids[corner]!]![axis]!;
        }
      }
      for (let axis: number = 0; axis < 3; axis++) {
        rows[row + 9 + axis] = rows[row + 3 + axis]! - rows[row + axis]!;
        rows[row + 12 + axis] = rows[row + 6 + axis]! - rows[row + axis]!;
      }
    }

    const boundsBuild: number[] = [];
    const nodesBuild: number[] = [];
    const leavesBuild: number[] = [];
    let depth: number = 0;

    /** Reproduce the source's stable centroid sort and exact split topology. */
    function build(indices: number[], level: number): number {
      depth = Math.max(depth, level);
      const node: number = nodesBuild.length / 4;
      const min: Point = [Infinity, Infinity, Infinity];
      const max: Point = [-Infinity, -Infinity, -Infinity];
      for (const index of indices) for (const vertex of triangles[index]!) for (let axis: number = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis]!, vertices[vertex]![axis]!);
        max[axis] = Math.max(max[axis]!, vertices[vertex]![axis]!);
      }
      boundsBuild.push(...min, ...max);
      nodesBuild.push(-1, -1, 0, 0);
      if (indices.length <= 8) {
        nodesBuild[node * 4 + 2] = leavesBuild.length;
        nodesBuild[node * 4 + 3] = indices.length;
        leavesBuild.push(...indices);
        return node;
      }
      let axis: number = 0;
      for (let candidate: number = 1; candidate < 3; candidate++) if (max[candidate]! - min[candidate]! > max[axis]! - min[axis]!) axis = candidate;
      /** Read a triangle's immutable centroid coordinate for spatial sorting. */
      const center: (index: number) => number = (index: number): number => triangles[index]!.reduce((sum: number, vertex: number): number => sum + vertices[vertex]![axis]!, 0);
      indices.sort((a: number, b: number): number => center(a) - center(b));
      const middle: number = indices.length >>> 1;
      nodesBuild[node * 4] = build(indices.slice(0, middle), level + 1);
      nodesBuild[node * 4 + 1] = build(indices.slice(middle), level + 1);
      return node;
    }
    build(triangles.map((_triangle: [number, number, number], index: number): number => index), 0);
    const boxes: Float64Array = Float64Array.from(boundsBuild);
    const nodes: Int32Array = Int32Array.from(nodesBuild);
    const leaves: Uint32Array = Uint32Array.from(leavesBuild);
    const stackNodes: Int32Array = new Int32Array(depth + 2);
    const stackBounds: Float64Array = new Float64Array(depth + 2);
    let px: number = 0, py: number = 0, pz: number = 0;
    let u: number = 0, v: number = 0, w: number = 0;
    let best: number = Infinity, signed: number = Infinity;

    /** Same max and sum operation order as the source, computed once per node. */
    function bound(node: number): number {
      const at: number = node * 6;
      const dx: number = Math.max(boxes[at]! - px, 0, px - boxes[at + 3]!);
      const dy: number = Math.max(boxes[at + 1]! - py, 0, py - boxes[at + 4]!);
      const dz: number = Math.max(boxes[at + 2]! - pz, 0, pz - boxes[at + 5]!);
      let squared: number = 0;
      squared += dx * dx;
      squared += dy * dy;
      squared += dz * dz;
      return squared;
    }

    /** Ericson regions with the source's expression order and scalar outputs. */
    function closest(at: number): void {
      const ax: number = rows[at]!, ay: number = rows[at + 1]!, az: number = rows[at + 2]!;
      const abx: number = rows[at + 9]!, aby: number = rows[at + 10]!, abz: number = rows[at + 11]!;
      const acx: number = rows[at + 12]!, acy: number = rows[at + 13]!, acz: number = rows[at + 14]!;
      const apx: number = px - ax, apy: number = py - ay, apz: number = pz - az;
      const d1: number = abx * apx + aby * apy + abz * apz;
      const d2: number = acx * apx + acy * apy + acz * apz;
      if (d1 <= 0 && d2 <= 0) { u = 1; v = 0; w = 0; return; }
      const bpx: number = px - rows[at + 3]!, bpy: number = py - rows[at + 4]!, bpz: number = pz - rows[at + 5]!;
      const d3: number = abx * bpx + aby * bpy + abz * bpz;
      const d4: number = acx * bpx + acy * bpy + acz * bpz;
      if (d3 >= 0 && d4 <= d3) { u = 0; v = 1; w = 0; return; }
      const vc: number = d1 * d4 - d3 * d2;
      if (vc <= 0 && d1 >= 0 && d3 <= 0) { v = d1 / (d1 - d3); u = 1 - v; w = 0; return; }
      const cpx: number = px - rows[at + 6]!, cpy: number = py - rows[at + 7]!, cpz: number = pz - rows[at + 8]!;
      const d5: number = abx * cpx + aby * cpy + abz * cpz;
      const d6: number = acx * cpx + acy * cpy + acz * cpz;
      if (d6 >= 0 && d5 <= d6) { u = 0; v = 0; w = 1; return; }
      const vb: number = d5 * d2 - d1 * d6;
      if (vb <= 0 && d2 >= 0 && d6 <= 0) { w = d2 / (d2 - d6); u = 1 - w; v = 0; return; }
      const va: number = d3 * d6 - d5 * d4;
      if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { w = (d4 - d3) / (d4 - d3 + d5 - d6); u = 0; v = 1 - w; return; }
      const inverse: number = 1 / (va + vb + vc);
      v = vb * inverse;
      w = vc * inverse;
      u = 1 - v - w;
    }

    /** Delay authored-normal interpolation until a strictly better witness wins. */
    function consider(index: number): void {
      const at: number = index * 24;
      closest(at);
      const dx: number = px - u * rows[at]! - v * rows[at + 3]! - w * rows[at + 6]!;
      const dy: number = py - u * rows[at + 1]! - v * rows[at + 4]! - w * rows[at + 7]!;
      const dz: number = pz - u * rows[at + 2]! - v * rows[at + 5]! - w * rows[at + 8]!;
      const squared: number = dx * dx + dy * dy + dz * dz;
      if (!(squared < best)) return;
      best = squared;
      const nx: number = u * rows[at + 15]! + v * rows[at + 18]! + w * rows[at + 21]!;
      const ny: number = u * rows[at + 16]! + v * rows[at + 19]! + w * rows[at + 22]!;
      const nz: number = u * rows[at + 17]! + v * rows[at + 20]! + w * rows[at + 23]!;
      signed = Math.sqrt(squared) * (dx * nx + dy * ny + dz * nz < 0 ? -1 : 1);
    }

    return {
      /** Read the closest emitted triangle, retaining the original strict tie rule. */
      field(x: number, y: number, z: number): number {
        px = x; py = y; pz = z;
        best = Infinity;
        signed = Infinity;
        let size: number = 1;
        stackNodes[0] = 0;
        stackBounds[0] = bound(0);
        while (size > 0) {
          size--;
          const node: number = stackNodes[size]!;
          const lower: number = stackBounds[size]!;
          if (lower > best) continue;
          const at: number = node * 4;
          const left: number = nodes[at]!;
          if (left < 0) {
            const start: number = nodes[at + 2]!;
            const stop: number = start + nodes[at + 3]!;
            for (let index: number = start; index < stop; index++) consider(leaves[index]!);
            continue;
          }
          const right: number = nodes[at + 1]!;
          const a: number = bound(left), b: number = bound(right);
          if (a < b) {
            stackNodes[size] = right; stackBounds[size++] = b;
            stackNodes[size] = left; stackBounds[size++] = a;
          } else {
            stackNodes[size] = left; stackBounds[size++] = a;
            stackNodes[size] = right; stackBounds[size++] = b;
          }
        }
        return signed;
      },
    };
  }
}
