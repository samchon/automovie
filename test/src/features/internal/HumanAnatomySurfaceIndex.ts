import type { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyVector } from "./HumanAnatomyVector";
import { HumanSkinIntegrityBvh } from "./HumanSkinIntegrityBvh";

/** A point in the emitted skin observer's millimetre frame. */
type V3 = HumanAnatomy.V3;

/**
 * Primitive-partition acceleration for independent emitted-skin observations.
 * One immutable skin supplies all coordinates; no construction reads this tree.
 *
 * @evidence contracts/common.md#principled-implementation Reuses the existing midpoint BVH's triangle boxes and leaf partition. Axis rays retain the anatomy observer's projected barycentric predicate; nearest queries use box-distance branch and bound with a closed-triangle distance that also handles collapsed points and segments. Inputs are finite indexed skins in ordinary body millimetres; numerical mesh admission and shared-edge ray ambiguity remain separate observer limits.
 * @evidence contracts/common.md#clear-and-simple-design One skin, one hierarchy and reusable traversal scratch serve both operations; the integrity BVH's different ray-hit rule is not called.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No person, fixture, answer or distance horizon selects candidates. Every potentially closer triangle remains eligible.
 * @evidence contracts/common.md#meaningful-documentation States the immutable mesh premise, independent-observer boundary, predicate preservation and numerical limits.
 * @evidence contracts/performance.md#efficient-algorithms Each triangle occurs once in leaf order. Midpoint partitioning uses O(T) storage and O(T log T) work for balanced input, with O(T squared) construction and O(T) query worst cases for a poor split. Traversals reject whole boxes before exact predicates and visit nearer distance children first.
 * @evidence contracts/performance.md#reuse-equivalent-work The owning surface helper weakly memoizes this index by immutable skin identity. A changed pose or copied skin has another identity and another hierarchy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns the existing BVH's 172 T typed bytes (60 bytes for an empty root) and a doubling traversal stack with fewer than 2 max(64, N) slots for N tree nodes. Since N is less than 2 T, total retained typed capacity is at most 188 T + 256 bytes for nonempty skins. It borrows skin buffers and owns no process or handle; the weak-key owner releases it with the last external skin reference.
 */
export class HumanAnatomySurfaceIndex {
  /** Existing typed hierarchy, with no copied mesh attributes. */
  private readonly tree: HumanSkinIntegrityBvh;

  /** Scratch stores node numbers, never skin or triangle references. */
  private stack: Int32Array = new Int32Array(64);

  /**
   * Build one skin's bounds and leaf partition; an empty skin stays queryable.
   *
   * @param skin Immutable emitted coordinates and triangle indices.
   * @evidence contracts/common.md#principled-implementation Delegates only hierarchy construction to the existing BVH and explicitly handles its empty-root representation in both queries.
   * @evidence contracts/common.md#clear-and-simple-design Stores one borrowed skin and one acceleration owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Performs no generated-person selection or alternate geometry path.
   * @evidence contracts/common.md#meaningful-documentation Names immutable ownership and empty-input behavior.
   * @evidence contracts/performance.md#efficient-algorithms Builds bounds once; the BVH's centroid array is temporary and its typed retained capacity is linear in T.
   * @evidence contracts/performance.md#reuse-equivalent-work Both query kinds read the same completed hierarchy.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires only the hierarchy; the surface helper owns its lifetime under the immutable skin's weak key.
   */
  public constructor(private readonly skin: HumanAnatomy.ISkin) {
    this.tree = new HumanSkinIntegrityBvh(skin);
  }

  /** Number of indexed triangle references, independent of coordinate extent. */
  public get triangles(): number {
    return this.tree.order.length;
  }

  /** Exact retained typed-array capacity; borrowed mesh and object overhead are excluded. */
  public get typedBytes(): number {
    return this.tree.tlo.byteLength + this.tree.thi.byteLength + this.tree.lo.byteLength + this.tree.hi.byteLength + this.tree.right.byteLength + this.tree.start.byteLength + this.tree.count.byteLength + this.tree.order.byteLength + this.stack.byteLength;
  }

  /**
   * Count the original anatomy predicate's signed-axis triangle hits.
   * Shared-edge hits still count each triangle; this is not a new inside oracle.
   *
   * @evidence contracts/common.md#principled-implementation A ray can hit a triangle only within its ancestor boxes' two projected intervals and forward extent. Leaves use the original determinant threshold, barycentric arithmetic and strict positive along distance unchanged.
   * @evidence contracts/common.md#clear-and-simple-design Separates conservative box rejection from the existing exact leaf calculation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts every eligible triangle, retaining diagonal ties rather than hiding them with a new topology rule.
   * @evidence contracts/common.md#meaningful-documentation Explains signed-axis semantics and the inherited tie limitation.
   * @evidence contracts/performance.md#efficient-algorithms Visits only ray-overlapping subtrees, with O(T) worst-case leaf work and depth-bounded reusable scratch.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses immutable boxes across all rays and distance requests without allocating candidate lists.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Resets the scalar stack cursor on each synchronous call; completed requests retain no query points or results.
   */
  public ray(p: V3, axis: number, sign: number): { crossings: number; nearest: number } {
    if (this.triangles === 0) return { crossings: 0, nearest: Infinity };
    const a: number = (axis + 1) % 3;
    const b: number = (axis + 2) % 3;
    let crossings: number = 0;
    let nearest: number = Infinity;
    let top: number = 1;
    this.stack[0] = 0;
    while (top > 0) {
      const node: number = this.stack[--top]!;
      const offset: number = 3 * node;
      if (p[a]! < this.tree.lo[offset + a]! || p[a]! > this.tree.hi[offset + a]! || p[b]! < this.tree.lo[offset + b]! || p[b]! > this.tree.hi[offset + b]!) continue;
      if (sign > 0 ? this.tree.hi[offset + axis]! < p[axis]! : this.tree.lo[offset + axis]! > p[axis]!) continue;
      const count: number = this.tree.count[node]!;
      if (count === 0) {
        this.reserve(top + 2);
        this.stack[top++] = node + 1;
        this.stack[top++] = this.tree.right[node]!;
        continue;
      }
      for (let k: number = this.tree.start[node]!; k < this.tree.start[node]! + count; k++) {
        const t: number = 3 * this.tree.order[k]!;
        const c: V3[] = [this.point(this.skin.I[t]!), this.point(this.skin.I[t + 1]!), this.point(this.skin.I[t + 2]!)];
        const d: number = (c[1]![a]! - c[0]![a]!) * (c[2]![b]! - c[0]![b]!) - (c[1]![b]! - c[0]![b]!) * (c[2]![a]! - c[0]![a]!);
        if (Math.abs(d) < 1e-12) continue;
        const l1: number = ((c[1]![a]! - p[a]!) * (c[2]![b]! - p[b]!) - (c[1]![b]! - p[b]!) * (c[2]![a]! - p[a]!)) / d;
        const l2: number = ((c[2]![a]! - p[a]!) * (c[0]![b]! - p[b]!) - (c[2]![b]! - p[b]!) * (c[0]![a]! - p[a]!)) / d;
        const l3: number = 1 - l1 - l2;
        if (l1 < 0 || l2 < 0 || l3 < 0) continue;
        const at: number = l1 * c[0]![axis]! + l2 * c[1]![axis]! + l3 * c[2]![axis]!;
        const along: number = (at - p[axis]!) * sign;
        if (along > 0) {
          crossings++;
          nearest = Math.min(nearest, along);
        }
      }
    }
    return { crossings, nearest };
  }

  /**
   * Global nearest-triangle distance, Infinity only for an empty skin.
   *
   * @evidence contracts/common.md#principled-implementation A box's Euclidean distance is a lower bound for every contained triangle. Branch and bound prunes only boxes farther than an already measured triangle; the closed-face/segment/point distance evaluates leaves, including all near and far queries and collapsed triangles.
   * @evidence contracts/common.md#clear-and-simple-design One traversal has no grid width, neighbourhood horizon or secondary distance index.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An interior or distant point is never discarded merely for lacking a local bucket.
   * @evidence contracts/common.md#meaningful-documentation States global scope and the empty-skin result; the vector helper documents its ordinary-millimetre numerical premise and degeneracy handling.
   * @evidence contracts/performance.md#efficient-algorithms Visits the closer child first to tighten the bound, skipping farther subtrees; exact work is O(T) in the worst case with no per-triangle retained copies.
   * @evidence contracts/performance.md#reuse-equivalent-work Shares the ray hierarchy and scratch for every immutable-skin query.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Holds no query point after the synchronous call and returns one scalar; traversal capacity belongs to the skin index.
   */
  public distance(p: V3): number {
    if (this.triangles === 0) return Infinity;
    let best: number = Infinity;
    let top: number = 1;
    this.stack[0] = 0;
    while (top > 0) {
      const node: number = this.stack[--top]!;
      if (this.lower(node, p) > best) continue;
      const count: number = this.tree.count[node]!;
      if (count === 0) {
        const left: number = node + 1;
        const right: number = this.tree.right[node]!;
        const nearLeft: boolean = this.lower(left, p) <= this.lower(right, p);
        this.reserve(top + 2);
        this.stack[top++] = nearLeft ? right : left;
        this.stack[top++] = nearLeft ? left : right;
        continue;
      }
      for (let k: number = this.tree.start[node]!; k < this.tree.start[node]! + count; k++) {
        const t: number = 3 * this.tree.order[k]!;
        best = Math.min(best, HumanAnatomyVector.triangleDistance(p, this.point(this.skin.I[t]!), this.point(this.skin.I[t + 1]!), this.point(this.skin.I[t + 2]!)));
      }
    }
    return best;
  }

  /** Lower distance bound from a point to a node's closed Cartesian box. */
  private lower(node: number, p: V3): number {
    const i: number = 3 * node;
    return Math.hypot(Math.max(0, this.tree.lo[i]! - p[0], p[0] - this.tree.hi[i]!), Math.max(0, this.tree.lo[i + 1]! - p[1], p[1] - this.tree.hi[i + 1]!), Math.max(0, this.tree.lo[i + 2]! - p[2], p[2] - this.tree.hi[i + 2]!));
  }

  /** Read a borrowed vertex without storing a de-indexed triangle soup. */
  private point(vertex: number): V3 {
    return [this.skin.P[3 * vertex]!, this.skin.P[3 * vertex + 1]!, this.skin.P[3 * vertex + 2]!];
  }

  /** Double numeric scratch only when both children would not fit. */
  private reserve(needed: number): void {
    if (needed <= this.stack.length) return;
    const grown: Int32Array = new Int32Array(2 * this.stack.length);
    grown.set(this.stack);
    this.stack = grown;
  }
}
