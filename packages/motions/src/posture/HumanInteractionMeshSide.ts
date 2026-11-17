import { Vector3, tetrahedralizeAutoMovieDelaunay } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMovieTetrahedralizeDelaunay,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The sides an interaction mesh records (`HumanInteractionMesh`): each
 * tetrahedron not flat on the key pose keeps its orientation, so no point
 * passes through the face across from it, which is how one body would pass
 * into another. Its signed volume, read as a length over the squared
 * extent, has a hard zero lower bound in each linear model; the nonlinear
 * solve's domain keeps it strictly positive.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a side is, why it is kept, its unit and its bound.
 * @evidence contracts/development/design.md#principled-representation A side as a tetrahedron's corners, the signed-volume inequality a convex model linearises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The side record, its builder, its reading and its model row.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The sides are read off the reference, never off the adapted points.
 */
export namespace HumanInteractionMeshSide {
  /**
   * A tetrahedron that records a side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the four corners and their reference orientation.
   * @evidence contracts/development/design.md#principled-representation Four point indices identify the oriented simplex whose determinant must remain positive.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the corners are stored; each reading derives its volume from the current points.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Stores no soft margin or fitted penalty that could trade a side against another constraint.
   */
  export interface ISide {
    /** The corners, in the mesh's positive orientation. */
    corners: readonly [number, number, number, number];
  }

  /**
   * The sides of a mesh over its reference points: every tetrahedron whose
   * reference volume exceeds what the joggle alone could give it.
   *
   * @param mesh The mesh.
   * @param reference The key pose's points, world metres.
   * @param extent The points' extent, metres.
   * @returns The sides.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which tetrahedra record a side and the bound each keeps.
   * @evidence contracts/development/implementation.md#principled-implementation A tetrahedron flat on the reference is oriented only by the joggle and records no side: the joggle moves each corner by at most `δ` per axis, so each edge by `2 √3 δ` and the triple product of three edges no longer than twice the extent by at most `3 (2 √3 δ)(2 extent)²`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One filter and one map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The flat bound is derived from the engine's joggle, not chosen.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the tetrahedra, once per adaptation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The volume and the joggle are the engine's.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function record(
    mesh: IAutoMovieTetrahedralizeDelaunay.IMesh,
    reference: readonly IAutoMovieVector3[],
    extent: number,
  ): ISide[] {
    const joggle: number =
      tetrahedralizeAutoMovieDelaunay.JOGGLE * Number.EPSILON * extent;
    const flat: number = 3 * (2 * Math.sqrt(3) * joggle) * (2 * extent) ** 2;
    return mesh.tetrahedra
      .filter(
        (t: readonly [number, number, number, number]): boolean =>
          tetrahedralizeAutoMovieDelaunay.volume(reference, t) > flat,
      )
      .map(
        (t: readonly [number, number, number, number]): ISide => ({
          corners: t,
        }),
      );
  }

  /**
   * A side's signed volume on the points, read as a length over the
   * squared extent.
   *
   * @param x The points, x then y then z by point.
   * @param side The side.
   * @param extent The points' extent, metres.
   * @returns Metres; positive where the side is kept.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the reading, its unit and its sign.
   * @evidence contracts/development/implementation.md#principled-implementation The triple product `(b - a) x (c - a) . (d - a)`, six times the volume, over the squared extent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One triple product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The engine's volume.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function value(x: Float64Array, side: ISide, extent: number): number {
    return (
      tetrahedralizeAutoMovieDelaunay.volume(
        side.corners.map((i: number): IAutoMovieVector3 => at(x, i)),
        [0, 1, 2, 3],
      ) /
      extent ** 2
    );
  }

  /**
   * A side's row in a convex model: its signed volume linearised at the
   * points, with a hard zero lower bound. Positivity is a domain constraint,
   * not a residual that a contact or a bone may trade against.
   *
   * @param x The points, x then y then z by point.
   * @param side The side.
   * @param extent The points' extent, metres.
   * @param key The row's key.
   * @returns The row over the step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the linearisation and the bound.
   * @evidence contracts/development/implementation.md#principled-implementation The gradient of `(b - a) x (c - a) . (d - a)` is `(c - a) x (d - a)` at `b`, `(d - a) x (b - a)` at `c`, `(b - a) x (c - a)` at `d` and minus their sum at `a`, each over the squared extent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three edges, four gradients, one row.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The row is hard with no upper bound; a side is never pinned at its reference volume or traded against another constraint.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `value` gives the reading the row is offset by.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function row(
    x: Float64Array,
    side: ISide,
    extent: number,
    key: string,
  ): IAutoMovieMotionHumanQuadraticProgram.IRow {
    const [a, b, c, d] = side.corners;
    const e1: IAutoMovieVector3 = Vector3.subtract(at(x, b), at(x, a));
    const e2: IAutoMovieVector3 = Vector3.subtract(at(x, c), at(x, a));
    const e3: IAutoMovieVector3 = Vector3.subtract(at(x, d), at(x, a));
    const gb: IAutoMovieVector3 = Vector3.cross(e2, e3);
    const gc: IAutoMovieVector3 = Vector3.cross(e3, e1);
    const gd: IAutoMovieVector3 = Vector3.cross(e1, e2);
    const ga: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(Vector3.add(gb, gc), gd),
      -1,
    );
    const corners: { point: number; g: IAutoMovieVector3 }[] = [
      { point: a, g: ga },
      { point: b, g: gb },
      { point: c, g: gc },
      { point: d, g: gd },
    ];
    return {
      key,
      index: corners.flatMap((k: { point: number }): number[] => [
        3 * k.point,
        3 * k.point + 1,
        3 * k.point + 2,
      ]),
      coef: corners.flatMap((k: { g: IAutoMovieVector3 }): number[] => [
        k.g.x / extent ** 2,
        k.g.y / extent ** 2,
        k.g.z / extent ** 2,
      ]),
      l: -value(x, side, extent),
      u: Infinity,
    };
  }

  /** A point of the array. */
  const at = (x: Float64Array, i: number): IAutoMovieVector3 => ({
    x: x[3 * i]!,
    y: x[3 * i + 1]!,
    z: x[3 * i + 2]!,
  });
}
