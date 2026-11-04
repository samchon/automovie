import type { HumanSkinIntegrity } from "./HumanSkinIntegrity";
import { HumanSkinIntegrityPredicate as Predicate } from "./HumanSkinIntegrityPredicate";
import { HumanSkinIntegrityVector as Vec } from "./HumanSkinIntegrityVector";

/**
 * Bounding volume hierarchy over the triangles of a mesh, split at the
 * midpoint of the centroids' longest axis. It answers which triangle pairs
 * cross and how often a ray crosses the mesh, each without visiting the pairs
 * whose boxes are apart.
 */
export class HumanSkinIntegrityBvh {
  /** Lower corner of every triangle's box, three numbers a triangle. */
  public readonly tlo: Float64Array;

  /** Upper corner of every triangle's box, three numbers a triangle. */
  public readonly thi: Float64Array;

  /** Lower corner of every node's box. */
  public readonly lo: Float64Array;

  /** Upper corner of every node's box. */
  public readonly hi: Float64Array;

  /** Right child of an inner node; its left child follows the node. */
  public readonly right: Int32Array;

  /** First entry of a leaf in `order`. */
  public readonly start: Int32Array;

  /** Triangles in a leaf; zero for an inner node. */
  public readonly count: Int32Array;

  /** Triangles in leaf order. */
  public readonly order: Int32Array;

  /** The boxes and the tree of a mesh. */
  public constructor(mesh: HumanSkinIntegrity.IMesh) {
    const T: number = mesh.I.length / 3;

    this.tlo = new Float64Array(3 * T);
    this.thi = new Float64Array(3 * T);

    // A triangle's box and centroid, axis by axis.
    const centre: Float64Array = new Float64Array(3 * T);

    for (let t: number = 0; t < T; t++)
      for (let k: number = 0; k < 3; k++) {
        const a: number = mesh.P[3 * mesh.I[3 * t]! + k]!;
        const b: number = mesh.P[3 * mesh.I[3 * t + 1]! + k]!;
        const c: number = mesh.P[3 * mesh.I[3 * t + 2]! + k]!;

        this.tlo[3 * t + k] = Math.min(a, b, c);
        this.thi[3 * t + k] = Math.max(a, b, c);
        centre[3 * t + k] = (a + b + c) / 3;
      }

    // A tree of leaves holding at least one triangle has fewer than 2 T nodes.
    const capacity: number = Math.max(1, 2 * T);

    this.lo = new Float64Array(3 * capacity);
    this.hi = new Float64Array(3 * capacity);
    this.right = new Int32Array(capacity);
    this.start = new Int32Array(capacity);
    this.count = new Int32Array(capacity);
    this.order = Int32Array.from({ length: T }, (_: unknown, k: number): number => k);

    if (T > 0) this.build(centre, 0, T, { next: 0 });
  }

  /**
   * Every pair of triangles that cross, each as `[t, u]` with `t < u`. Pairs
   * sharing an edge (two corners) are skipped: they touch by construction.
   */
  public crossings(mesh: HumanSkinIntegrity.IMesh): [number, number][] {
    const out: [number, number][] = [];
    const T: number = mesh.I.length / 3;

    // The traversal stack doubles whenever a node's two children would not
    // fit, so no subtree is dropped however deep the hierarchy.
    let stack: Int32Array = new Int32Array(1024);

    for (let t: number = 0; t < T; t++) {
      let top: number = 0;

      stack[top++] = 0;

      const x0: number = this.tlo[3 * t]!;
      const y0: number = this.tlo[3 * t + 1]!;
      const z0: number = this.tlo[3 * t + 2]!;
      const x1: number = this.thi[3 * t]!;
      const y1: number = this.thi[3 * t + 1]!;
      const z1: number = this.thi[3 * t + 2]!;

      while (top > 0) {
        const node: number = stack[--top]!;

        // A node whose box is apart from this triangle's holds no partner.
        if (
          this.lo[3 * node]! > x1 ||
          this.lo[3 * node + 1]! > y1 ||
          this.lo[3 * node + 2]! > z1 ||
          this.hi[3 * node]! < x0 ||
          this.hi[3 * node + 1]! < y0 ||
          this.hi[3 * node + 2]! < z0
        )
          continue;

        // An inner node pushes both children, growing the stack when they would not fit.
        const count: number = this.count[node]!;

        if (count === 0) {
          if (top + 2 > stack.length) {
            const grown: Int32Array = new Int32Array(2 * stack.length);

            grown.set(stack);
            stack = grown;
          }

          stack[top++] = node + 1;
          stack[top++] = this.right[node]!;
          continue;
        }

        // A leaf tests each later triangle whose own box meets this one's.
        const start: number = this.start[node]!;

        for (let k: number = start; k < start + count; k++) {
          const u: number = this.order[k]!;

          if (u <= t) continue;

          if (
            this.tlo[3 * u]! > x1 ||
            this.tlo[3 * u + 1]! > y1 ||
            this.tlo[3 * u + 2]! > z1 ||
            this.thi[3 * u]! < x0 ||
            this.thi[3 * u + 1]! < y0 ||
            this.thi[3 * u + 2]! < z0
          )
            continue;

          if (Predicate.shared(mesh.I, t, u) >= 2) continue;

          if (Predicate.crosses(mesh.P, mesh.I, t, u)) out.push([t, u]);
        }
      }
    }

    return out;
  }

  /** The number of triangles but one that a ray crosses beyond its origin. */
  public hits(mesh: HumanSkinIntegrity.IMesh, o: Vec.V3, d: Vec.V3, skip: number): number {
    const inverse: Vec.V3 = [1 / d[0], 1 / d[1], 1 / d[2]];
    const stack: number[] = [0];
    let hits: number = 0;

    while (stack.length) {
      const node: number = stack.pop()!;

      // Slab test of the ray against the node's box.
      let near: number = 0;
      let far: number = Infinity;

      for (let k: number = 0; k < 3; k++) {
        const t1: number = (this.lo[3 * node + k]! - o[k]!) * inverse[k]!;
        const t2: number = (this.hi[3 * node + k]! - o[k]!) * inverse[k]!;

        near = Math.max(near, Math.min(t1, t2));
        far = Math.min(far, Math.max(t1, t2));
      }

      if (!(near <= far)) continue;

      // An inner node descends into both children; a leaf tests its triangles.
      const count: number = this.count[node]!;

      if (count === 0) {
        stack.push(node + 1, this.right[node]!);
        continue;
      }

      for (let k: number = this.start[node]!; k < this.start[node]! + count; k++) {
        const t: number = this.order[k]!;

        if (t !== skip && rayHits(mesh, t, o, d)) hits++;
      }
    }

    return hits;
  }

  /** Builds the subtree over `order[begin .. end)` and returns its node. */
  private build(centre: Float64Array, begin: number, end: number, nodes: { next: number }): number {
    const node: number = nodes.next++;

    // The boxes of the triangles and of their centroids.
    const lo: Vec.V3 = [Infinity, Infinity, Infinity];
    const hi: Vec.V3 = [-Infinity, -Infinity, -Infinity];
    const centreLo: Vec.V3 = [Infinity, Infinity, Infinity];
    const centreHi: Vec.V3 = [-Infinity, -Infinity, -Infinity];

    for (let i: number = begin; i < end; i++) {
      const t: number = this.order[i]!;

      for (let k: number = 0; k < 3; k++) {
        lo[k] = Math.min(lo[k]!, this.tlo[3 * t + k]!);
        hi[k] = Math.max(hi[k]!, this.thi[3 * t + k]!);
        centreLo[k] = Math.min(centreLo[k]!, centre[3 * t + k]!);
        centreHi[k] = Math.max(centreHi[k]!, centre[3 * t + k]!);
      }
    }

    for (let k: number = 0; k < 3; k++) {
      this.lo[3 * node + k] = lo[k]!;
      this.hi[3 * node + k] = hi[k]!;
    }

    // A few triangles make a leaf.
    if (end - begin <= 4) {
      this.start[node] = begin;
      this.count[node] = end - begin;

      return node;
    }

    // Partition at the midpoint of the centroids' longest axis.
    const spread: Vec.V3 = [centreHi[0] - centreLo[0], centreHi[1] - centreLo[1], centreHi[2] - centreLo[2]];
    const axis: number = spread[0] >= spread[1] && spread[0] >= spread[2] ? 0 : spread[1] >= spread[2] ? 1 : 2;
    const middle: number = (centreLo[axis]! + centreHi[axis]!) / 2;
    let i: number = begin;
    let j: number = end - 1;

    while (i <= j) {
      if (centre[3 * this.order[i]! + axis]! < middle) i++;
      else {
        const swap: number = this.order[i]!;

        this.order[i] = this.order[j]!;
        this.order[j] = swap;
        j--;
      }
    }

    // Centroids all on one side of the midpoint split the range in half instead.
    const split: number = i === begin || i === end ? (begin + end) >> 1 : i;

    this.count[node] = 0;
    this.build(centre, begin, split, nodes);
    this.right[node] = this.build(centre, split, end, nodes);

    return node;
  }
}

/**
 * Whether a ray crosses a triangle beyond its origin (Moeller and Trumbore).
 * A crossing within a billionth of the origin's coordinates is the origin's
 * own sheet, such as a triangle lying on the sampled one.
 */
function rayHits(mesh: HumanSkinIntegrity.IMesh, t: number, o: Vec.V3, d: Vec.V3): boolean {
  const a: Vec.V3 = Vec.at(mesh.P, mesh.I[3 * t]!);
  const e1: Vec.V3 = Vec.sub(Vec.at(mesh.P, mesh.I[3 * t + 1]!), a);
  const e2: Vec.V3 = Vec.sub(Vec.at(mesh.P, mesh.I[3 * t + 2]!), a);
  const p: Vec.V3 = Vec.cross(d, e2);
  const det: number = Vec.dot(e1, p);

  if (det === 0) return false;

  // Barycentric coordinates of the hit inside the triangle.
  const s: Vec.V3 = Vec.sub(o, a);
  const u: number = Vec.dot(s, p) / det;

  if (u < 0 || u > 1) return false;

  const q: Vec.V3 = Vec.cross(s, e1);
  const v: number = Vec.dot(d, q) / det;

  if (v < 0 || u + v > 1) return false;

  // The hit lies ahead of the origin by more than rounding.
  const reach: number = 1e-9 * (1 + Math.max(Math.abs(o[0]), Math.abs(o[1]), Math.abs(o[2])));

  return Vec.dot(e2, q) / det > reach;
}
