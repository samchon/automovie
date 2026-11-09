/**
 * Cone aligned to local Y: base at `+height / 2`, apex at `-height / 2`.
 *
 * @evidence contracts/development/design.md#principled-representation A positive radius and axial height determine the cone; tessellation uses a positive-Y base ring and negative-Y zero-radius end, matching the documented orientation rather than assuming an upward apex.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Radius and height are the only shape inputs, with the part transform responsible for orienting the downward-pointing local cone in a scene.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts All cones share the positive-Y base convention regardless of their subject; no fixture-specific rotation changes which end the radius describes.
 * @evidence contracts/development/common.md#meaningful-documentation Locates the base and apex relative to the origin and specifies finite positive radius and full axial height in metres.
 */
export interface IAutoMovieConeShape {
  /** Discriminator. */
  type: "cone";

  /** Finite positive base radius, metres. */
  radius: number;

  /** Finite positive full height along local Y, metres. */
  height: number;
}
