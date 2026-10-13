import * as THREE from "three";
import type { IAutoMovieViewerSubjectLens } from "./IAutoMovieViewerSubjectLens.js";
import type { IAutoMovieViewerSubjectPose } from "./IAutoMovieViewerSubjectPose.js";

/**
 * Build a pose from a bare position and heading.
 *
 * The turntable answers "show me this thing"; this answers "put the eye here,
 * pointing there". Both exist because a reviewer who has already found
 * something needs to say where it was seen from, and a plan's angles are not
 * always where it was.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership `autoMovieViewerPoseFromHeading` lets an inspection state an arbitrary angle and distance of its own rather than choosing from a fixed set.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan `autoMovieViewerPoseFromHeading` resolves an explicit direction and projection into the same camera state a plan entry produces.
 * @author Samchon
 */
export const autoMovieViewerPoseFromHeading = (
  position: { x: number; y: number; z: number },
  headingDeg: { yaw: number; pitch: number },
  lens: IAutoMovieViewerSubjectLens,
  clip: { near: number; far: number },
): IAutoMovieViewerSubjectPose => {
  if (clip.near <= 0 || clip.far <= clip.near)
    throw new RangeError(
      `inspection clip range must satisfy 0 < near < far, not near=${clip.near} far=${clip.far}`,
    );
  const yaw = THREE.MathUtils.degToRad(headingDeg.yaw);
  const pitch = THREE.MathUtils.degToRad(headingDeg.pitch);
  const horizontal = Math.cos(pitch);
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
};
