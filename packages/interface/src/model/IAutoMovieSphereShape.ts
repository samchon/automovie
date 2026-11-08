/**
 * Sphere centred at the model part's local origin.
 *
 * @evidence contracts/development/design.md#principled-representation One positive finite radius determines the rotationally symmetric sphere; model validation checks that radius and tessellation samples latitude and longitude at the declared distance from the origin.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Radius is the sole dimension because axis-specific extents would describe an ellipsoid; the part transform owns scaling and world placement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No subject name chooses sphere size or resolution; the tessellator's fixed polygonal approximation is shared by geometric consumers and viewers.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the local centre and finite positive metre radius, avoiding ambiguity between radius and diameter.
 */
export interface IAutoMovieSphereShape {
  /** Discriminator. */
  type: "sphere";

  /** Finite positive radius, metres. */
  radius: number;
}
