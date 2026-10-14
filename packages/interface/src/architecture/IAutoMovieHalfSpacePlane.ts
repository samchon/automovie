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
 * @evidence contracts/common.md#principled-implementation `builtSpaceContainsPoint` tests each cell plane's dot product against `offset + 1e-9`. Building validation requires finite components, finite computed normal length above 1e-12, finite offset and at least four planes. Analysis `validateSolidPlanes` shares the component/offset/count rules but its direction collector rejects only a finite computed length at or below 1e-12, so finite components with an overflowing norm are not refused by that rule. Neither proves a bounded, nonempty intersection.
 * @evidence contracts/common.md#clear-and-simple-design One normal and one offset express any half-space in the inequality form both consumers evaluate directly, so cells and occluders share this record instead of each defining a plane.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cell containment keeps authored normal scale, so scaling an equivalent inequality changes its physical slack. Vertex enumeration separately normalizes and ignores normals at or below its 1e-6 observation tolerance, larger than validation's 1e-12 floor; admitted containment and enumerated bounds can therefore differ. Binary64 dot products can round or overflow and are not an exact numerical certificate.
 * @evidence contracts/common.md#meaningful-documentation States the inside convention, both consumers, the containment slack and how normal length scales it, the minimum plane count, and that boundedness is not validated.
 * @author Samchon
 */
export interface IAutoMovieHalfSpacePlane {
  /** Finite, non-zero plane normal; it need not be normalized. */
  normal: IAutoMovieVector3;

  /** Finite plane offset in the same scale as the normal. */
  offset: number;
}
