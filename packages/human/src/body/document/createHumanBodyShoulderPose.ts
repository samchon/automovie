import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";

/**
 * One thorax-relative humeral goal of a body document.
 *
 * Plane is the elevation plane (0 lateral, +90 anterior), elevation is total humeral elevation and axialRotation is axial rotation, all in degrees; omitted axial rotation is zero. The builder resolves the goal through its declared girdle and upper-arm skin frames. Editor presets and review states share this constructor; document admission and the basis's shoulder contract still judge the goal.
 *
 * @evidence contracts/common.md#principled-implementation The named shoulder and requested thorax-relative plane/elevation/axial degrees are preserved in the existing TT goal schema with zero axial rotation when omitted.
 * @evidence contracts/common.md#clear-and-simple-design One goal constructor supplies presets and documents while the existing shoulder resolver owns conversion into performed frames.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This record constructor enforces no canonical plane, finite value or clinical reach and does not manufacture an independently measured shoulder girdle.
 * @evidence contracts/common.md#meaningful-documentation The prose states plane signs, degree units, default axial rotation and the separate document/basis admission responsibilities.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar-field copying takes constant work without shoulder-envelope search or forward kinematics.
 * @evidence contracts/performance.md#reuse-equivalent-work Presets share one TT field mapping; no cross-call cache is needed for this cheap value construction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned goal owns four scalar fields and retains no basis envelope, rig, source mesh or task.
 *
 * @author Samchon
 */
export function createHumanBodyShoulderPose(
  bone: IAutoMovieHumanBodyShoulderPose["bone"],
  plane: number,
  elevation: number,
  axialRotation: number = 0,
): IAutoMovieHumanBodyShoulderPose {
  return { bone, plane, elevation, axialRotation };
}
