/**
 * Closed cylinder along local Y, with its midpoint at the local origin.
 *
 * @evidence contracts/development/design.md#principled-representation Equal-radius end disks separated by the positive axial height define a closed cylinder; tessellation places those disks at plus and minus half height and validation admits only finite positive dimensions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One shared radius and one height encode the circular solid; tapering belongs to the cone arm and placement belongs to the enclosing part.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The same circular side and closed-end construction applies to every cylinder, with no named prop changing its radius or cap policy.
 * @evidence contracts/development/common.md#meaningful-documentation Gives closure, midpoint origin, local Y alignment and finite positive metre radius and full height rather than a half-height parameter.
 */
export interface IAutoMovieCylinderShape {
  /** Discriminator. */
  type: "cylinder";

  /** Finite positive radius of both ends, metres. */
  radius: number;

  /** Finite positive full height along local Y, metres. */
  height: number;
}
