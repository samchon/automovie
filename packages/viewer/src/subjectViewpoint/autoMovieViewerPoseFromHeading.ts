import * as THREE from "three";
import type { IAutoMovieViewerSubjectLens } from "./IAutoMovieViewerSubjectLens.js";
import type { IAutoMovieViewerSubjectPose } from "./IAutoMovieViewerSubjectPose.js";

/**
 * Resolve an inspection heading into a target one metre ahead: yaw zero faces -Z, positive yaw faces -X, and positive pitch points upward. The returned pose borrows position and lens; clip range is checked only by ordered comparisons.
 *
 * @evidence contracts/common.md#principled-implementation Uses spherical heading trigonometry in degrees with a one-metre orientation target; ordinary clips must satisfy 0<near<far, while finite position/heading/lens and nonfinite clip refusal are not fully enforced.
 * @evidence contracts/common.md#clear-and-simple-design A pure pose constructor stays separate from camera mutation and subject-bound framing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture direction or visual fit replaces authored heading; the one-metre target is orientation only and need not lie within the clip range.
 * @evidence contracts/common.md#meaningful-documentation Documents axes/signs, target distance, borrowed references and current numeric admission gap.
 * @evidence contracts/performance.md#efficient-algorithms Fixed trigonometric arithmetic creates one pose and one target record, independent of mesh/population size.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call computes fresh target coordinates; shared position/lens references do not cache camera or scene effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns only returned small records and borrows input references; it acquires no native resource or background task.
 */
export function autoMovieViewerPoseFromHeading(position: { x: number; y: number; z: number }, headingDeg: { yaw: number; pitch: number }, lens: IAutoMovieViewerSubjectLens, clip: { near: number; far: number }): IAutoMovieViewerSubjectPose {
  if (clip.near <= 0 || clip.far <= clip.near)
    throw new RangeError(
      `inspection clip range must satisfy 0 < near < far, not near=${clip.near} far=${clip.far}`,
    );
  const yaw: number = THREE.MathUtils.degToRad(headingDeg.yaw);
  const pitch: number = THREE.MathUtils.degToRad(headingDeg.pitch);
  const horizontal: number = Math.cos(pitch);
  // A point one metre ahead fixes orientation. It need not lie inside the
  // supplied clip range; looking toward it does not make it a visible subject.
  return {
    position,
    target: {
      x: position.x - Math.sin(yaw) * horizontal,
      y: position.y + Math.sin(pitch),
      z: position.z - Math.cos(yaw) * horizontal,
    },
    lens,
    near: clip.near,
    far: clip.far,
  };
}
