import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanFoot } from "../posture/HumanFoot";

/**
 * Floor outlines used by stance support geometry: convex clipping, hulls,
 * signed edge distance and horizontal foot translation in world metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Members state floor orientation, signed distances, clipping direction and ownership.
 * @evidence contracts/development/design.md#principled-representation Uses existing world vectors and foot placements; outlines are counter-clockwise in x-z, with their geometric validity supplied by callers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The four existing walkStanceGeometry operations live once here so that geometry can separately own its prepared readings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body, scene or sampled trajectory is encoded in these generic outline operations.
 */
export namespace walkStanceOutline {
  /**
   * Keep the part of a convex outline where `(q - at) dot normal >= offset`.
   *
   * @param outline Counter-clockwise world-floor corners.
   * @param at A point on the clipping line's reference.
   * @param normal The kept side's unit direction.
   * @param offset The least signed distance along the direction, metres.
   * @returns Kept vertices and exact edge intersections in input order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States clipping inequality, orientation, units and edge-intersection output.
   * @evidence contracts/development/implementation.md#principled-implementation Applies convex half-plane clipping, interpolating each straddling edge at da/(da-db) with the original inclusive boundary test.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered edge loop computes signed distances, emits the kept vertex and then its possible intersection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the original scalar subtraction/dot-product order and exact zero comparison without a changed clipping tolerance.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(v) time and at most O(v) output for v vertices, without allocating subtraction vectors for either endpoint.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing kept vertex objects are borrowed unchanged; intersections are fresh, and no result is cached across outlines.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one caller-owned array and retains no state or handle.
   */
  export function clip(
    outline: readonly IAutoMovieVector3[],
    at: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    offset: number,
  ): IAutoMovieVector3[] {
    const out: IAutoMovieVector3[] = [];
    for (let i: number = 0; i < outline.length; i++) {
      const a: IAutoMovieVector3 = outline[i]!;
      const b: IAutoMovieVector3 = outline[(i + 1) % outline.length]!;
      const da: number = (a.x - at.x) * normal.x + (a.y - at.y) * normal.y + (a.z - at.z) * normal.z - offset;
      const db: number = (b.x - at.x) * normal.x + (b.y - at.y) * normal.y + (b.z - at.z) * normal.z - offset;
      if (da >= 0) out.push(a);
      if (da >= 0 !== db >= 0) out.push(Vector3.lerp(a, b, da / (da - db)));
    }
    return out;
  }

  /**
   * Andrew's monotone-chain convex hull, counter-clockwise in world x-z.
   *
   * @param points Floor points; repeated and collinear points are permitted.
   * @returns The hull vertices, borrowing supplied points in a fresh array.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the hull algorithm, x-z orientation and borrowed-point/fresh-array ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Sorts by x then z and removes non-left turns from the lower and upper monotone chains; fewer than three points retain their sorted order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One turn predicate and one chain walk serve both sorted directions.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original <=0 collinearity decision, tie order and small-input behavior with no coordinate rounding.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(v log v) sorting and O(v) chain work/output; the private sorted array is reversed in place after the lower walk instead of copied for the upper walk.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both directional walks reuse the same privately sorted point references; caller input order and point values remain untouched.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state; sorted and chain arrays die with the call and the returned hull belongs to its caller.
   */
  export function hull(points: readonly IAutoMovieVector3[]): IAutoMovieVector3[] {
    const sorted: IAutoMovieVector3[] = [...points].sort(
      (a: IAutoMovieVector3, b: IAutoMovieVector3): number => a.x - b.x || a.z - b.z,
    );
    if (sorted.length < 3) return sorted;
    const turn: (o: IAutoMovieVector3, a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (
      o: IAutoMovieVector3,
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
    ): number => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
    const chain: (order: readonly IAutoMovieVector3[]) => IAutoMovieVector3[] = (
      order: readonly IAutoMovieVector3[],
    ): IAutoMovieVector3[] => {
      const out: IAutoMovieVector3[] = [];
      for (const p of order) {
        while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0)
          out.pop();
        out.push(p);
      }
      out.pop();
      return out;
    };
    const lower: IAutoMovieVector3[] = chain(sorted);
    return [...lower, ...chain(sorted.reverse())];
  }

  /**
   * Signed nearest-edge distance to a convex floor outline, metres.
   *
   * @param hull Counter-clockwise world x-z vertices.
   * @param point The world-floor point.
   * @returns Positive inside, negative outside; an empty outline gives -Infinity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States orientation, world-metre distance signs and the empty-outline result.
   * @evidence contracts/development/implementation.md#principled-implementation Tests every counter-clockwise edge's half-plane and projects onto each closed edge segment for the least Euclidean distance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One edge loop computes containment and nearest distance together, then applies the sign once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains exact edge-side comparisons, coincident-edge projection and the original degenerate-outline sign.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(v) scalar work and O(1) scratch for v hull vertices, without allocation or a second containment pass.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the caller's current hull directly; distinct points and outlines are not memoized.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Uses scalar accumulators only and retains no input or result.
   */
  export function depth(hull: readonly IAutoMovieVector3[], point: IAutoMovieVector3): number {
    let inside: boolean = hull.length >= 3;
    let nearest: number = Infinity;
    for (let i: number = 0; i < hull.length; i++) {
      const a: IAutoMovieVector3 = hull[i]!;
      const b: IAutoMovieVector3 = hull[(i + 1) % hull.length]!;
      const ex: number = b.x - a.x;
      const ez: number = b.z - a.z;
      const px: number = point.x - a.x;
      const pz: number = point.z - a.z;
      if (ex * pz - ez * px < 0) inside = false;
      const span: number = ex * ex + ez * ez;
      const u: number = span > 0 ? Math.min(1, Math.max(0, (px * ex + pz * ez) / span)) : 0;
      nearest = Math.min(nearest, Math.hypot(px - u * ex, pz - u * ez));
    }
    return inside ? nearest : -nearest;
  }

  /**
   * Translate a placement horizontally without changing its rotation or height.
   *
   * @param foot The world placement.
   * @param dx World x translation, metres.
   * @param dz World z translation, metres.
   * @returns The original placement for zero motion, otherwise a new ankle record.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States horizontal world units and zero-motion versus moved ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Adds the requested x/z translation and retains the original ankle height and foot rotation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One zero-motion branch precedes a direct placement construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Applies the supplied translation exactly with no floor correction or tolerance.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(1) arithmetic and at most one placement/ankle pair, with no allocation for zero motion.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the unchanged rotation, and the complete placement when both translations are zero; no history is retained.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The caller owns a moved placement and the function retains nothing.
   */
  export function slid(foot: HumanFoot.IPlacement, dx: number, dz: number): HumanFoot.IPlacement {
    return dx === 0 && dz === 0
      ? foot
      : { ankle: { x: foot.ankle.x + dx, y: foot.ankle.y, z: foot.ankle.z + dz }, rotation: foot.rotation };
  }
}
