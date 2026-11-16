import { Vector3, pointInHull } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Project a floor point onto the original convex support outline, retaining
 * an inside point and the first strictly nearer closed-edge projection.
 *
 * @param outline The nonempty convex floor outline, world or centre-relative metres.
 * @param point The point in that same frame.
 * @returns The input inside point or original nearest-edge point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the nonempty convex floor premise, common metre frame, inside identity and strict nearest-edge tie rule; prepare documents exact copied geometry and its changing-point reader.
 * @evidence contracts/development/implementation.md#principled-implementation Uses original pointInHull containment followed by every closed edge's clamped dot/span projection and three-coordinate distance. Preparation computes each fixed b-a and dot(ab,ab) once, while every actual changing point still runs the same projection and winner comparisons.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One projection kernel serves this one-shot reader and the fixed-outline preparation; the engine owns vector arithmetic and containment.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves span>0 collapsed-edge handling, every copied x/y/z scalar, edge order, arithmetic grouping and strict d<gap ties without a new margin or remembered answer. The prepared path exposes no mutable private vertex.
 * @evidence contracts/development/implementation.md#efficient-algorithms One-shot queries take O(v) containment/projection and constant live winner storage without preparing inside points. Explicit fixed-outline preparation takes O(v) time/storage once; each O(v) millisecond query omits repeated edge subtraction/span products and temporary vectors.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One-shot queries read the supplied outline directly. The settling operation's explicit copied outline proves fixed edge prerequisites; each query point remains actual, and changing support requires a new preparation rather than another point's answer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One-shot projection retains nothing. One caller-owned prepared closure holds v copied vertices and v edge records until settling ends, with no query history or handles; inside outputs borrow the actual query point and projected outputs expose no private vertex.
 */
export function staggerNearest(
  outline: readonly IAutoMovieVector3[],
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return project(outline, point);
}

/**
 * Fixed-outline preparation for the same pressure projection.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The companion supplies one explicitly fixed convex support reader, with each queried pressure point still actual.
 * @evidence contracts/development/design.md#principled-representation Retains copied floor vertices and their original edge difference/span, not a sampled pressure trajectory or fitted support.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The settling loop consumes this one preparation; StaggerPendulum.nearest retains the one-shot entry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pressure, containment result, constraint margin or motion sample is stored or approximated.
 */
export namespace staggerNearest {
  /**
   * Prepare one fixed outline for actual changing pressure queries.
   *
   * @param outline The nonempty convex floor outline, copied exactly in metres.
   * @returns The original projection rule for each same-frame point.
   *
   * Each ordered edge keeps its original b-a and dot(ab,ab). Every changing
   * point still runs containment, clamped point-edge projection, distance and
   * strict winner comparisons through the shared kernel, with the original
   * collapsed-edge and inside decisions. No queried answer is remembered.
   *
   * One copied vertex/edge array costs O(v) preparation/storage; each O(v)
   * query avoids repeating fixed edge arithmetic. The caller releases this
   * reader with settling, and no returned vector exposes its private vertices.
   */
  export function prepare(
    outline: readonly IAutoMovieVector3[],
  ): (point: IAutoMovieVector3) => IAutoMovieVector3 {
    const fixed: readonly IAutoMovieVector3[] = outline.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 => ({ x: point.x, y: point.y, z: point.z }),
    );
    const edges: readonly IEdge[] = fixed.map((a: IAutoMovieVector3, i: number): IEdge => {
      const ab: IAutoMovieVector3 = Vector3.subtract(fixed[(i + 1) % fixed.length]!, a);
      return { a, ab, span: Vector3.dot(ab, ab) };
    });
    return (point: IAutoMovieVector3): IAutoMovieVector3 => project(fixed, point, edges);
  }
}

/** One fixed edge's original arithmetic prerequisites. */
interface IEdge {
  /** The edge's first point, metres in the outline frame. */
  readonly a: IAutoMovieVector3;
  /** Its original b-a, metres. */
  readonly ab: IAutoMovieVector3;
  /** dot(ab,ab), square metres. */
  readonly span: number;
}

/** Keep the original ordered projection; only fixed edge operands may be lent. */
function project(
  outline: readonly IAutoMovieVector3[],
  point: IAutoMovieVector3,
  edges?: readonly IEdge[],
): IAutoMovieVector3 {
  if (outline.length >= 3 && pointInHull(point, outline)) return point;
  let best: IAutoMovieVector3 = outline[0]!;
  let gap: number = Infinity;
  for (let i: number = 0; i < outline.length; i++) {
    const edge: IEdge | undefined = edges?.[i];
    const a: IAutoMovieVector3 = edge === undefined ? outline[i]! : edge.a;
    const ab: IAutoMovieVector3 = edge === undefined
      ? Vector3.subtract(outline[(i + 1) % outline.length]!, a)
      : edge.ab;
    const span: number = edge === undefined ? Vector3.dot(ab, ab) : edge.span;
    const u: number = span > 0
      ? Math.min(1, Math.max(0, Vector3.dot(Vector3.subtract(point, a), ab) / span))
      : 0;
    const q: IAutoMovieVector3 = Vector3.add(a, Vector3.scale(ab, u));
    const d: number = Vector3.distance(point, q);
    if (d < gap) {
      gap = d;
      best = q;
    }
  }
  return edges !== undefined && best !== undefined && best === outline[0] ? { ...best } : best;
}
