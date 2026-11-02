import { AutoMovieHumanMandibularBorder as Border } from "./AutoMovieHumanMandibularBorder";

/** Physical closest-triangle query over the actual emitted mandibular patch. */
export namespace AutoMovieHumanMandibularMeshField {
  /** Cached spatial query; physical source normals determine its local sign. */
  export interface IPrepared {
    /** Signed physical distance to the emitted patch, millimetres; negative inward. */
    field(x: number, y: number, z: number): number;
  }

  /** Bounding-volume node, with triangle leaves small enough for direct reads. */
  interface INode {
    /** Lower body-coordinate corner of this node's physical bounding box. */
    min: Border.Point;
    /** Upper body-coordinate corner of this node's physical bounding box. */
    max: Border.Point;
    /** First spatial child; absent on a triangle leaf. */
    left?: INode;
    /** Second spatial child; absent on a triangle leaf. */
    right?: INode;
    /** Original triangle indices owned by a leaf; absent on an internal node. */
    triangles?: number[];
  }

  /** Physical displacement. */
  function subtract(a: Border.Point, b: Border.Point): Border.Point { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }

  /** Physical dot product. */
  function dot(a: Border.Point, b: Border.Point): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  /** Barycentric coordinates of the closest point on a physical triangle. */
  function closest(p: Border.Point, a: Border.Point, b: Border.Point, c: Border.Point): [number, number, number] {
    const ab: Border.Point = subtract(b, a);
    const ac: Border.Point = subtract(c, a);
    const ap: Border.Point = subtract(p, a);
    const d1: number = dot(ab, ap);
    const d2: number = dot(ac, ap);
    if (d1 <= 0 && d2 <= 0) return [1, 0, 0];
    const bp: Border.Point = subtract(p, b);
    const d3: number = dot(ab, bp);
    const d4: number = dot(ac, bp);
    if (d3 >= 0 && d4 <= d3) return [0, 1, 0];
    const vc: number = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v: number = d1 / (d1 - d3); return [1 - v, v, 0]; }
    const cp: Border.Point = subtract(p, c);
    const d5: number = dot(ab, cp);
    const d6: number = dot(ac, cp);
    if (d6 >= 0 && d5 <= d6) return [0, 0, 1];
    const vb: number = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w: number = d2 / (d2 - d6); return [1 - w, 0, w]; }
    const va: number = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w: number = (d4 - d3) / (d4 - d3 + d5 - d6); return [0, 1 - w, w]; }
    const inverse: number = 1 / (va + vb + vc);
    const v: number = vb * inverse;
    const w: number = vc * inverse;
    return [1 - v - w, v, w];
  }

  /** Prepare a BVH once; no query changes or rebuilds the physical patch. */
  export function prepare(vertices: Border.Point[], triangles: [number, number, number][], normals: Border.Point[]): IPrepared {
    /** Spatial median split changes only lookup cost, never geometry. */
    function build(indices: number[]): INode {
      const min: Border.Point = [Infinity, Infinity, Infinity];
      const max: Border.Point = [-Infinity, -Infinity, -Infinity];
      for (const i of indices) for (const vertex of triangles[i]!) for (let j: number = 0; j < 3; j++) {
        min[j] = Math.min(min[j]!, vertices[vertex]![j]!);
        max[j] = Math.max(max[j]!, vertices[vertex]![j]!);
      }
      if (indices.length <= 8) return { min, max, triangles: indices };
      let axis: number = 0;
      for (let j: number = 1; j < 3; j++) if (max[j]! - min[j]! > max[axis]! - min[axis]!) axis = j;
      const center = (i: number): number => triangles[i]!.reduce((sum: number, v: number): number => sum + vertices[v]![axis]!, 0);
      indices.sort((a: number, b: number): number => center(a) - center(b));
      const mid: number = indices.length >>> 1;
      return { min, max, left: build(indices.slice(0, mid)), right: build(indices.slice(mid)) };
    }

    const root: INode = build(triangles.map((_t: [number, number, number], i: number): number => i));
    return {
      /** Read the closest emitted triangle and sign by its physical source normal. */
      field(x: number, y: number, z: number): number {
        const p: Border.Point = [x, y, z];
        let best: number = Infinity;
        let signed: number = Infinity;

        /** Conservative box lower bound permits exact closest-point pruning. */
        function bound(node: INode): number {
          let squared: number = 0;
          for (let j: number = 0; j < 3; j++) {
            const d: number = Math.max(node.min[j]! - p[j]!, 0, p[j]! - node.max[j]!);
            squared += d * d;
          }
          return squared;
        }

        /** Observe actual triangles, then sign by their owned physical normals. */
        function visit(node: INode): void {
          if (bound(node) > best) return;
          if (node.triangles !== undefined) {
            for (const index of node.triangles) {
              const ids: [number, number, number] = triangles[index]!;
              const a: Border.Point = vertices[ids[0]]!;
              const b: Border.Point = vertices[ids[1]]!;
              const c: Border.Point = vertices[ids[2]]!;
              const weights: [number, number, number] = closest(p, a, b, c);
              const delta: Border.Point = [0, 0, 0];
              const normal: Border.Point = [0, 0, 0];
              for (let j: number = 0; j < 3; j++) {
                delta[j] = p[j]! - weights[0] * a[j]! - weights[1] * b[j]! - weights[2] * c[j]!;
                normal[j] = weights[0] * normals[ids[0]]![j]! + weights[1] * normals[ids[1]]![j]! + weights[2] * normals[ids[2]]![j]!;
              }
              const squared: number = dot(delta, delta);
              if (squared < best) { best = squared; signed = Math.sqrt(squared) * (dot(delta, normal) < 0 ? -1 : 1); }
            }
            return;
          }
          const a: INode = node.left!;
          const b: INode = node.right!;
          if (bound(a) < bound(b)) { visit(a); visit(b); }
          else { visit(b); visit(a); }
        }
        visit(root);
        return signed;
      },
    };
  }
}
