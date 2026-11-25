/**
 * A 3D vector in automovie's right-handed, y-up frame, as in glTF 2.0 and VRM
 * 1.0.
 *
 * The same shape carries metre positions/translations, unitless directions and
 * per-axis factors such as scale. The containing field states its meaning and
 * required range; this type enforces neither finiteness nor length, which
 * remain the owning record's admission responsibility.
 */
export interface IAutoMovieVector3 {
  /** X: toward the left (+) of a character facing +Z, its right (−). */
  x: number;

  /** Y: up (+) / down (−). */
  y: number;

  /** Z: the front (+) of a character at zero heading, its back (−). */
  z: number;
}
