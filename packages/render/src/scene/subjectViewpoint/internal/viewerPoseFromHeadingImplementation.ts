import * as THREE from "three";

import type { IAutoMovieRenderViewerSubjectLens } from "../../IAutoMovieRenderViewerSubjectLens";
import type { IAutoMovieRenderViewerSubjectPose } from "../../IAutoMovieRenderViewerSubjectPose";

/*
 * Resolve an inspection heading into a target one metre ahead: yaw zero faces
 * -Z, positive yaw faces -X, and positive pitch points upward. The returned
 * pose borrows position and lens; clip range is checked only by ordered
 * comparisons.
 */
export function viewerPoseFromHeadingImplementation(
  position: { x: number; y: number; z: number },
  headingDeg: { yaw: number; pitch: number },
  lens: IAutoMovieRenderViewerSubjectLens,
  clip: { near: number; far: number },
): IAutoMovieRenderViewerSubjectPose {
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
