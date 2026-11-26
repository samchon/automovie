import { Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The point of an outline nearest a point.
 *
 * @param outline The nonempty convex floor outline, metres.
 * @param point The point, in the same frame.
 * @returns The point itself inside, else the nearest edge point; the first
 *   strictly nearer edge wins a tie.
 */
export function staggerNearest(
  outline: readonly IAutoMovieVector3[],
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return project(outline, point);
}

/**
 * The point of a convex support outline on the floor nearest a point, where a
 * stagger's centre of pressure is held (`StaggerPendulum`, `staggerClose`): the
 * point itself when it lies inside, else its projection onto the nearest closed
 * edge.
 */
export namespace staggerNearest {
  /**
   * Prepare one fixed outline for many queries.
   *
   * @param outline The nonempty convex floor outline, copied, metres.
   * @returns The projection of each queried point onto the copied outline, as
   *   `of` gives it.
   */
  export function prepare(
    outline: readonly IAutoMovieVector3[],
  ): (point: IAutoMovieVector3) => IAutoMovieVector3 {
    const fixed: readonly IAutoMovieVector3[] = outline.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 => ({
        x: point.x,
        y: point.y,
        z: point.z,
      }),
    );
    const edges: readonly IEdge[] = fixed.map(
      (a: IAutoMovieVector3, i: number): IEdge => {
        const ab: IAutoMovieVector3 = Vector3.subtract(
          fixed[(i + 1) % fixed.length]!,
          a,
        );
        return { a, ab, span: Vector3.dot(ab, ab) };
      },
    );
    return (point: IAutoMovieVector3): IAutoMovieVector3 =>
      project(fixed, point, edges);
  }
}

/** One fixed edge's prerequisites. */
interface IEdge {
  /** The edge's first point, metres in the outline frame. */
  readonly a: IAutoMovieVector3;
  /** Its second point less its first, metres. */
  readonly ab: IAutoMovieVector3;
  /** Dot(ab, ab), square metres. */
  readonly span: number;
}

/**
 * The nearest point of an outline, its edges' prerequisites read from `edges`
 * when given.
 */
function project(
  outline: readonly IAutoMovieVector3[],
  point: IAutoMovieVector3,
  edges?: readonly IEdge[],
): IAutoMovieVector3 {
  if (outline.length >= 3 && AutoMovieEngineMath.pointInHull(point, outline)) return point;
  let best: IAutoMovieVector3 = outline[0]!;
  let gap: number = Infinity;
  for (let i: number = 0; i < outline.length; i++) {
    const edge: IEdge | undefined = edges?.[i];
    const a: IAutoMovieVector3 = edge === undefined ? outline[i]! : edge.a;
    const ab: IAutoMovieVector3 =
      edge === undefined
        ? Vector3.subtract(outline[(i + 1) % outline.length]!, a)
        : edge.ab;
    const span: number = edge === undefined ? Vector3.dot(ab, ab) : edge.span;
    const u: number =
      span > 0
        ? Math.min(
            1,
            Math.max(0, Vector3.dot(Vector3.subtract(point, a), ab) / span),
          )
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
