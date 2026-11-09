/**
 * Rectangular box centred at the local origin, before the part transform.
 *
 * @evidence contracts/development/design.md#principled-representation Three finite positive full extents define the box; tessellation places its corners at plus or minus half each extent and model validation refuses nonpositive dimensions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Width, height and depth directly follow local X, Y and Z, leaving placement and rotation on the enclosing model part rather than adding corner coordinates here.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every box uses the declared dimensions with the same centred convention; no part name or subject selects alternate bounds.
 * @evidence contracts/development/common.md#meaningful-documentation States the centred local frame and full metre extents on all three axes; each dimension must be finite and strictly positive.
 */
export interface IAutoMovieBoxShape {
  /** Discriminator. */
  type: "box";

  /** Finite positive full size along local X, metres. */
  width: number;

  /** Finite positive full size along local Y, metres. */
  height: number;

  /** Finite positive full size along local Z, metres. */
  depth: number;
}
