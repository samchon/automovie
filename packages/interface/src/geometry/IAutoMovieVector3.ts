/**
 * A 3D vector in automovie's right-handed, y-up frame, as in glTF 2.0 and VRM 1.0.
 *
 * The same shape carries metre positions/translations, unitless directions and per-axis factors such as scale. The containing field states its meaning and required range; this type enforces neither finiteness nor length, which remain the owning record's admission responsibility.
 *
 * @evidence contracts/common.md#principled-implementation Three Cartesian components in the right-handed y-up frame glTF and `three.js` use, so engine values pass to the viewer and to imported clips without an axis swap or handedness flip.
 * @evidence contracts/common.md#clear-and-simple-design One plain three-number record serves points, directions and scale factors, with meaning stated at each field rather than split into nominal point and direction types that interface's no-wrapper rule forbids.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type promises no unit length or finiteness it cannot enforce; each owning validator, such as `validateTransformScalars` for a transform, checks the values its field needs.
 * @evidence contracts/common.md#meaningful-documentation States the frame and handedness, that one shape carries several meanings decided by the field, and where ranges are enforced; members give each axis's direction relative to a character at zero heading.
 */
export interface IAutoMovieVector3 {
  /** X: toward the left (+) of a character facing +Z, its right (−). */
  x: number;

  /** Y: up (+) / down (−). */
  y: number;

  /** Z: the front (+) of a character at zero heading, its back (−). */
  z: number;
}
