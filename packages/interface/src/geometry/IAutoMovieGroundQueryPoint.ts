/**
 * Horizontal world position used to select or sample declared ground surfaces.
 *
 * X and Z are metres in the same world frame as the terrain footprint and
 * heightfield grid. Height is deliberately absent: containment and terrain
 * interpolation determine the ground datum independently of a staged Y value.
 * The query helpers borrow this record without mutation. It has no default,
 * coordinate conversion or validation of its own; callers supply the intended
 * finite position and the owning ground operation defines absence behavior.
 *
 * @evidence contracts/development/design.md#principled-representation One XZ point addresses both first-containing-surface selection and that surface's terrain-height interpolation in their shared world frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Formation relief, direct geometry ground queries and world ground/surface helpers share this representation instead of repeating operation-specific point records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No Y component or implicit plane turns an absent surface into support; the result owner retains null/zero/nonwalkable distinctions.
 * @evidence contracts/development/common.md#meaningful-documentation Defines axis order, metre units, world frame, borrowed ownership and caller validation responsibility.
 */
export interface IAutoMovieGroundQueryPoint {
  /** World X coordinate in metres. */
  x: number;

  /** World Z coordinate in metres. */
  z: number;
}
