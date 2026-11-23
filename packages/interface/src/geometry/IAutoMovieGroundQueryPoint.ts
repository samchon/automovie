/**
 * Horizontal world position used to select or sample declared ground surfaces.
 *
 * X and Z are metres in the same world frame as the terrain footprint and
 * heightfield grid. Height is deliberately absent: containment and terrain
 * interpolation determine the ground datum independently of a staged Y value.
 * The query helpers borrow this record without mutation. It has no default,
 * coordinate conversion or validation of its own; callers supply the intended
 * finite position and the owning ground operation defines absence behavior.
 */
export interface IAutoMovieGroundQueryPoint {
  /** World X coordinate in metres. */
  x: number;

  /** World Z coordinate in metres. */
  z: number;
}
