import { Vector3, pointInHull } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The point of a convex support outline on the floor nearest a point, where
 * a stagger's centre of pressure is held (`StaggerPendulum`, `staggerClose`):
 * the point itself when it lies inside, else its projection onto the
 * nearest closed edge.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the projection, its premise of a nonempty convex floor outline and its readers.
 * @evidence contracts/development/design.md#principled-representation Floor points in one metre frame; a prepared outline keeps its copied corners and each edge's difference and squared span, never a projected answer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `of` for one query and `prepare` for the settling loop's many queries on one fixed outline.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No margin, sampled pressure or remembered answer is stored.
 */
export namespace staggerNearest {
  /**
   * The point of an outline nearest a point.
   *
   * @param outline The nonempty convex floor outline, metres.
   * @param point The point, in the same frame.
   * @returns The point itself inside, else the nearest edge point; the first strictly nearer edge wins a tie.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the inside rule and the tie rule.
   * @evidence contracts/development/implementation.md#principled-implementation Containment by the engine's `pointInHull`, then every closed edge's clamped projection, the nearest kept; a collapsed edge projects to its corner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One kernel shared with `prepare`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No margin or tolerance moves the point.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(v) containment and edge projections for v corners.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    outline: readonly IAutoMovieVector3[],
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return project(outline, point);
  }

  /**
   * Prepare one fixed outline for many queries.
   *
   * @param outline The nonempty convex floor outline, copied, metres.
   * @returns The projection of each queried point onto the copied outline, as `of` gives it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is copied and what each query returns.
   * @evidence contracts/development/implementation.md#principled-implementation The same kernel as `of`, its edges' differences and squared spans computed once.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One copy of the corners and one edge record each, then the shared kernel per query.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every query runs the containment test and every edge projection; no answer is kept.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(v) preparation once; each O(v) query skips the edge arithmetic that does not change.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The outline is copied, so the prepared edges stay those of the outline given whatever the caller does with it after.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned reader holds v corners and v edge records until its caller, the settling loop, releases it; a returned point never exposes a private corner.
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

/** One fixed edge's prerequisites. */
interface IEdge {
  /** The edge's first point, metres in the outline frame. */
  readonly a: IAutoMovieVector3;
  /** Its second point less its first, metres. */
  readonly ab: IAutoMovieVector3;
  /** dot(ab, ab), square metres. */
  readonly span: number;
}

/** The nearest point of an outline, its edges' prerequisites read from `edges` when given. */
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

  // A prepared outline's own corner is copied out, so no caller holds it.
  return edges !== undefined && best === outline[0] ? { ...best } : best;
}
