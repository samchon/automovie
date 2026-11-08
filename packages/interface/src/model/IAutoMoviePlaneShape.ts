/**
 * Flat rectangle centred at the origin in the local XZ plane, with zero height.
 *
 * @evidence contracts/development/design.md#principled-representation Positive width and depth define a zero-height rectangular surface on local Y equals zero; extent validation checks both dimensions before geometric consumers use half-extents in X and Z.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The plane carries no meaningless height parameter, and its position, orientation and material remain fields of the owning model part.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Zero height is the plane's geometric definition rather than an exception for a particular floor; the current tessellator's collapsed box faces remain a topology limitation.
 * @evidence contracts/development/common.md#meaningful-documentation States the XZ support plane, centred origin, zero height and finite positive full metre spans along X and Z.
 */
export interface IAutoMoviePlaneShape {
  /** Discriminator. */
  type: "plane";

  /** Finite positive full size along local X, metres. */
  width: number;

  /** Finite positive full size along local Z, metres. */
  depth: number;
}
