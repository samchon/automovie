import type { AutoMovieVector3Tuple } from "../index";

/** Right-handed physical cutting frame: u cross v = n, all axes unit.
 *
 * @evidence contracts/development/design.md#principled-representation Origin uses the supplied physical units while three dimensionless axes form a right-handed orthonormal basis; planeFrame constructs and normalizes that basis.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Plane cuts, projected contour area and source-side orientation share the same origin and basis rather than separate projection conventions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A coordinate frame neither authorizes source registration nor changes the source mesh; direct structural values remain the caller's finite/orthonormal premise.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the physical origin from dimensionless directed axes and names the frame-construction admission owner.
 */
export interface IAutoMoviePlaneFrame {
 
 /** Physical point on the plane in the source Cartesian frame. */
  origin: AutoMovieVector3Tuple;
 
 /** Unit normal whose direction fixes the orientation convention. */
  n: AutoMovieVector3Tuple;
 
 /** First unit in-plane axis; u cross v equals n. */
  u: AutoMovieVector3Tuple;
 
 /** Second unit in-plane axis, orthogonal to u and n. */
  v: AutoMovieVector3Tuple;
}
