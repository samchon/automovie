/**
 * Sphere centred at the model part's local origin.
 *
 * @evidence contracts/common.md#principled-implementation One positive finite radius determines the rotationally symmetric sphere; model validation checks that radius and tessellation samples latitude and longitude at the declared distance from the origin.
 * @evidence contracts/common.md#clear-and-simple-design Radius is the sole dimension because axis-specific extents would describe an ellipsoid; the part transform owns scaling and world placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject name chooses sphere size or resolution; the tessellator's fixed polygonal approximation is shared by geometric consumers and viewers.
 * @evidence contracts/common.md#meaningful-documentation Gives the local centre and finite positive metre radius, avoiding ambiguity between radius and diameter.
 * @author Samchon
 */
export interface IAutoMovieSphereShape {
  /** Discriminator. */
  type: "sphere";

  /** Finite positive radius, metres. */
  radius: number;
}
