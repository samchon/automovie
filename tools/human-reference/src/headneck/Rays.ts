import { V3 } from "../geometry/V3.ts";
import { add } from "../geometry/add.ts";
import { cross } from "../geometry/cross.ts";
import { dot } from "../geometry/dot.ts";
import { mul } from "../geometry/mul.ts";
import { sub } from "../geometry/sub.ts";

interface Node {
  lo: V3;
  hi: V3;
  left?: Node;
  right?: Node;
  triangles?: number[];
}

/**
 * A source-triangle ray index for private geometric observations. The owner
 * borrows the supplied arrays as immutable data for the index's lifetime.
 * Auxiliary components can use a triangle subset without copying mesh data.
 *
 * @evidence contracts/common.md#principled-implementation A median-split axis-aligned hierarchy prunes source triangles before affine ray-triangle intersection; explicit parallel slab handling avoids infinity-times-zero ambiguity.
 * @evidence contracts/common.md#clear-and-simple-design One index owns its hierarchy and borrows one source geometry, while each query owns its traversal and ordered hits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same triangle equations and slab rules apply to every admitted reference; no anatomical indices or expected hits are embedded.
 * @evidence contracts/common.md#meaningful-documentation The contract states immutable borrowing, ray-parameter units, finite query admission and the numerical parallel/near-origin exclusions.
 * @evidence contracts/performance.md#efficient-algorithms For S indexed triangles, construction sorts median subsets in O(S log-squared S) time and O(S) retained storage; a ray visits bounding nodes and candidate triangles, with O(S) worst-case intersection work plus O(H log H) sorting for H hits.
 * @evidence contracts/performance.md#reuse-equivalent-work Triangle bounds and centroids produce one reusable hierarchy for repeated rays against the same immutable source arrays; changed geometry requires a new index.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance retains one hierarchy and borrowed source arrays until its owner releases it; each invocation releases its traversal stack and returns only its hit list.
 */
export class Rays {
  private readonly root: Node;

  /**
   * Builds an index without mutating the admitted source vertices, triangles or
   * subset. Source units and frame pass through unchanged.
   *
   * The widest-axis median partition retains eight-triangle leaves. This is
   * traversal granularity, independent of anatomy. Its temporary centroid map
   * releases after construction; the instance retains the hierarchy and
   * immutable borrowed source arrays. The owning class documents its costs.
   */
  public constructor(
    /** Borrowed source positions in millimetres and the admitted frame; the owner keeps coordinates immutable for this index's lifetime. */
    public readonly vertices: readonly V3[],
    /** Borrowed zero-based vertex-index triples; subset addresses this array, whose owner keeps topology immutable for this index's lifetime. */
    public readonly triangles: readonly (readonly number[])[],
    subset: readonly number[],
  ) {
    const centres: Map<number, V3> = new Map();
    for (const index of subset) {
      const triangle: readonly number[] = triangles[index];
      centres.set(
        index,
        mul(
          add(
            add(vertices[triangle[0]], vertices[triangle[1]]),
            vertices[triangle[2]],
          ),
          1 / 3,
        ),
      );
    }
    const build = (indices: number[]): Node => {
      const lo: V3 = [Infinity, Infinity, Infinity];
      const hi: V3 = [-Infinity, -Infinity, -Infinity];
      for (const index of indices)
        for (const vertex of triangles[index])
          for (let axis: number = 0; axis < 3; axis++) {
            lo[axis] = Math.min(lo[axis], vertices[vertex][axis]);
            hi[axis] = Math.max(hi[axis], vertices[vertex][axis]);
          }
      if (indices.length <= 8) return { lo, hi, triangles: indices };
      let widest: number = 0;
      for (let axis: number = 1; axis < 3; axis++)
        if (hi[axis] - lo[axis] > hi[widest] - lo[widest]) widest = axis;
      indices.sort(
        (a: number, b: number): number =>
          centres.get(a)![widest] - centres.get(b)![widest],
      );
      const middle: number = indices.length >> 1;
      return {
        lo,
        hi,
        left: build(indices.slice(0, middle)),
        right: build(indices.slice(middle)),
      };
    };
    this.root = build([...subset]);
  }

  /**
   * Returns all positive intersections in increasing ray parameter. A parameter
   * is millimetres only when direction is unit length in a millimetre frame.
   * Degenerate/parallel triangles with determinant below 1e-12 and hits within
   * parameter 1e-9 of the origin are excluded. Coincident triangle hits remain
   * separate observations rather than being merged into an anatomical edge.
   *
   * @evidence contracts/common.md#principled-implementation Slab intervals admit candidate bounds and barycentric affine intersection admits points inside each source triangle; edge coincidences remain explicit.
   * @evidence contracts/common.md#clear-and-simple-design Query-local traversal produces a complete hit list before sorting once; no hidden nearest-hit or anatomical selection changes the result.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed degeneracy tolerances are numerical exclusions documented in ray-parameter units and are not tuned per identity.
   * @evidence contracts/common.md#meaningful-documentation The comment states parameter units, numerical exclusions and duplicate-hit meaning.
   * @evidence contracts/performance.md#efficient-algorithms The query visits intersected hierarchy nodes and their leaf triangles, with O(S) worst-case work and O(H log H) final sorting for H hits.
   * @evidence contracts/performance.md#reuse-equivalent-work The immutable instance hierarchy is reused; ray intervals and hit data are specific to this query and never cached across inputs.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The stack is bounded by hierarchy traversal, the returned list by indexed triangles, and no query state remains in the index.
   */
  public hits(
    origin: V3,
    direction: V3,
    maximum: number = Infinity,
  ): { t: number; tri: number; p: V3 }[] {
    if (
      origin.some((value: number): boolean => !Number.isFinite(value)) ||
      direction.some((value: number): boolean => !Number.isFinite(value)) ||
      direction.every((value: number): boolean => value === 0) ||
      !(maximum > 0)
    )
      throw new Error(
        "A finite nonzero ray and positive parameter limit are required",
      );
    const output: { t: number; tri: number; p: V3 }[] = [];
    const stack: Node[] = [this.root];
    while (stack.length) {
      const node: Node = stack.pop()!;
      let near: number = 0;
      let far: number = maximum;
      let missed: boolean = false;
      for (let axis: number = 0; axis < 3; axis++) {
        if (direction[axis] === 0) {
          if (origin[axis] < node.lo[axis] || origin[axis] > node.hi[axis])
            missed = true;
          continue;
        }
        let first: number = (node.lo[axis] - origin[axis]) / direction[axis];
        let second: number = (node.hi[axis] - origin[axis]) / direction[axis];
        if (first > second) [first, second] = [second, first];
        near = Math.max(near, first);
        far = Math.min(far, second);
        if (near > far) missed = true;
      }
      if (missed) continue;
      if (!node.triangles) {
        stack.push(node.left!, node.right!);
        continue;
      }
      for (const index of node.triangles) {
        const triangle: readonly number[] = this.triangles[index];
        const a: V3 = this.vertices[triangle[0]];
        const e1: V3 = sub(this.vertices[triangle[1]], a);
        const e2: V3 = sub(this.vertices[triangle[2]], a);
        const crossDirection: V3 = cross(direction, e2);
        const determinant: number = dot(e1, crossDirection);
        if (Math.abs(determinant) < 1e-12) continue;
        const offset: V3 = sub(origin, a);
        const u: number = dot(offset, crossDirection) / determinant;
        if (u < 0 || u > 1) continue;
        const crossOffset: V3 = cross(offset, e1);
        const v: number = dot(direction, crossOffset) / determinant;
        if (v < 0 || u + v > 1) continue;
        const parameter: number = dot(e2, crossOffset) / determinant;
        if (parameter > 1e-9 && parameter < maximum)
          output.push({
            t: parameter,
            tri: index,
            p: add(origin, mul(direction, parameter)),
          });
      }
    }
    output.sort((a: { t: number }, b: { t: number }): number => a.t - b.t);
    return output;
  }
}
