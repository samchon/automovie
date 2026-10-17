import { V3 } from "./V3.ts";
import { closestOnTri } from "./closestOnTri.ts";
import { dot } from "./dot.ts";
import { sub } from "./sub.ts";

interface Node {
  lo: V3;
  hi: V3;
  left?: Node;
  right?: Node;
  triangles?: number[];
}

/**
 * Triangle BVH over caller-owned immutable arrays; exact queries prune only boxes farther than the current best.
 *
 * @evidence contracts/common.md#principled-implementation Axis-aligned box distances are lower bounds on their contained triangles, so branch-and-bound retains every possible nearest candidate for finite nonempty immutable geometry.
 * @evidence contracts/common.md#clear-and-simple-design One index owns spatial partitioning and delegates primitive projection to closestOnTri; callers own input admission and geometry lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no identity branch, fixed search radius or substituted answer; the eight-triangle leaf capacity changes search cost rather than geometric meaning.
 * @evidence contracts/common.md#meaningful-documentation States immutable borrowed-array ownership, global nearest-point semantics and physical input units.
 * @evidence contracts/performance.md#efficient-algorithms Recursive median sorting costs O(n log-squared n) construction and O(n) retained tree storage; a query can visit every triangle in the worst case.
 * @evidence contracts/performance.md#reuse-equivalent-work The same tree is reused only while the caller keeps vertex positions and triangle addresses unchanged; no query-result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance retains borrowed geometry and its linear-size tree until released; query traversal stacks are local to each call.
 */
export class SurfaceIndex {
  private readonly root: Node;

  public constructor(
    /** Caller-owned physical positions, immutable throughout the index lifetime. */
    public readonly vertices: V3[],
    /** Caller-owned triangle addresses into vertices, immutable throughout the index lifetime. */
    public readonly triangles: number[][],
  ) {
    if (!triangles.length)
      throw new Error("A surface index requires triangles");
    this.root = this.build(
      triangles.map((_t: number[], i: number): number => i),
    );
  }

  /** Global nearest surface point in input units; no search-radius cutoff or source-address transfer is used.
   *
   * @evidence contracts/common.md#principled-implementation An exact triangle query and point-to-box lower bounds perform global closest-point branch-and-bound search.
   * @evidence contracts/common.md#clear-and-simple-design The immutable BVH owns spatial pruning while closestOnTri owns primitive projection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no specimen-specific search radius or expected-result branch.
   * @evidence contracts/common.md#meaningful-documentation Documents global nearest-point semantics and shared physical units.
   * @evidence contracts/performance.md#efficient-algorithms A query is data-dependent, O(triangles) worst case; construction sorts subranges in O(triangles log-squared triangles) with linear retained tree storage.
   * @evidence contracts/performance.md#reuse-equivalent-work Every call reuses the same BVH only while its caller-owned geometry arrays remain unchanged.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The query stack is call-local; the index retains its geometry and BVH until its owner releases the index.
   */
  public closest(point: V3): { d: number; q: V3; tri: number } {
    let best: number = Infinity;
    let q: V3 = point;
    let tri: number = -1;
    const queue: Node[] = [this.root];
    while (queue.length) {
      const node: Node = queue.pop()!;
      if (this.boxDistance(point, node) > best) continue;
      if (node.triangles) {
        for (const i of node.triangles) {
          const t: number[] = this.triangles[i];
          const candidate: V3 = closestOnTri(
            point,
            this.vertices[t[0]],
            this.vertices[t[1]],
            this.vertices[t[2]],
          );
          const difference: V3 = sub(point, candidate);
          const distance: number = dot(difference, difference);
          if (distance < best) {
            best = distance;
            q = candidate;
            tri = i;
          }
        }
      } else {
        const left: Node = node.left!,
          right: Node = node.right!;
        if (this.boxDistance(point, left) < this.boxDistance(point, right))
          queue.push(right, left);
        else queue.push(left, right);
      }
    }
    return { d: Math.sqrt(best), q, tri };
  }

  private boxDistance(point: V3, node: Node): number {
    let total: number = 0;
    for (let k: number = 0; k < 3; k++) {
      const d: number = Math.max(
        node.lo[k] - point[k],
        0,
        point[k] - node.hi[k],
      );
      total += d * d;
    }
    return total;
  }

  private build(indices: number[]): Node {
    const lo: V3 = [Infinity, Infinity, Infinity],
      hi: V3 = [-Infinity, -Infinity, -Infinity];
    for (const i of indices)
      for (const v of this.triangles[i])
        for (let k: number = 0; k < 3; k++) {
          lo[k] = Math.min(lo[k], this.vertices[v][k]);
          hi[k] = Math.max(hi[k], this.vertices[v][k]);
        }
    if (indices.length <= 8) return { lo, hi, triangles: indices };
    const axis: number = [0, 1, 2].sort(
      (a: number, b: number): number => hi[b] - lo[b] - (hi[a] - lo[a]),
    )[0];
    const centre = (i: number): number =>
      this.triangles[i].reduce(
        (sum: number, vertex: number): number =>
          sum + this.vertices[vertex][axis],
        0,
      );
    indices.sort(
      (a: number, b: number): number => centre(a) - centre(b) || a - b,
    );
    const mid: number = Math.floor(indices.length / 2);
    return {
      lo,
      hi,
      left: this.build(indices.slice(0, mid)),
      right: this.build(indices.slice(mid)),
    };
  }
}
