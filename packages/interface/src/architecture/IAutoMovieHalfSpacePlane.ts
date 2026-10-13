import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One world-space half-space plane, as used by a logical space's convex cells
 * and by an analysis context's occluders.
 *
 * A point is inside when `dot(normal, point) <= offset`. Because the normal is
 * not normalized, space containment's fixed `1e-9` slack on that dot product
 * is a distance of `1e-9 / |normal|` metres.
 *
 * @evidence contracts/common.md#principled-implementation A plane as `normal` and `offset` with inside meaning `dot(normal, point) <= offset`; `builtSpaceContainsPoint` applies its `1e-9` slack to the raw product, so the effective distance tolerance shrinks as the normal grows, while `builtConvexCellVertices` normalizes before solving corners.
 * @evidence contracts/common.md#clear-and-simple-design Two fields shared by space cells and context occluders, which read the same inside convention instead of keeping separate plane records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Normalization is not demanded from the author; both validators refuse only non-finite components, normals no longer than `1e-12`, and non-finite offsets.
 * @evidence contracts/common.md#meaningful-documentation States the inside test, both users, that the normal need not be unit length, the offset's scale, and how the containment slack depends on the normal's length.
 * @author Samchon
 */
export interface IAutoMovieHalfSpacePlane {
  /** Non-zero plane normal; it need not be normalized. */
  normal: IAutoMovieVector3;

  /** Finite plane offset in the same scale as the normal. */
  offset: number;
}
