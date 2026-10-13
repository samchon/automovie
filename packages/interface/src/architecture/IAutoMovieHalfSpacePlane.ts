import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One world-space half-space plane, as used by a logical space's convex cells
 * and by an analysis context's occluders.
 *
 * A point is inside when `dot(normal, point) <= offset`. Because the normal is
 * not normalized, space containment's fixed `1e-9` slack on that dot product
 * is a distance of `1e-9 / |normal|` metres. A convex cell or occluder needs
 * at least four planes; whether they enclose a bounded, non-empty region is not
 * checked.
 *
 * @evidence contracts/common.md#principled-implementation `builtSpaceContainsPoint` tests `dot(normal, point) <= offset + 1e-9` for every plane of a cell; `validateBuiltEnvironment` and `validateSolidPlanes` require a finite normal longer than `1e-12`, a finite offset, and at least four planes per solid.
 * @evidence contracts/common.md#clear-and-simple-design One normal and one offset express any half-space in the inequality form both consumers evaluate directly, so cells and occluders share this record instead of each defining a plane.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Normals are not renormalized behind the author's back, so the slack's metric meaning varies with normal length; that limitation and the unchecked boundedness of a plane set are stated instead of hidden.
 * @evidence contracts/common.md#meaningful-documentation States the inside convention, both consumers, the containment slack and how normal length scales it, the minimum plane count, and that boundedness is not validated.
 * @author Samchon
 */
export interface IAutoMovieHalfSpacePlane {
  /** Finite, non-zero plane normal; it need not be normalized. */
  normal: IAutoMovieVector3;

  /** Finite plane offset in the same scale as the normal. */
  offset: number;
}
