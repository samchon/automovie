import * as THREE from "three";

/**
 * Place a perspective camera on a preset view so a box fills the frame.
 *
 * A view is a direction from the subject to the eye, given by azimuth and elevation in degrees in the humanoid rest frame where the subject faces +Z and its left is +X: azimuth 0 looks at the face, 90 at the subject's left side, 180 at the back and 270 at the right side; elevation is the eye's angle above the horizontal, negative below. Presets name fourteen such directions from the subject's side (see {@link frameHumanViewerCamera.PRESETS}); any other direction is passed as angles. `top` and `below` look straight down and up with the front toward the bottom and the top of the image respectively. Straight views keep `camera.up` at +Y and offset the eye by 1e-4 of the distance along +Z, so orbit controls stay valid and the image orientation is fixed.
 *
 * The distance is the smallest that keeps every corner of the box inside both the vertical and horizontal field of view, from the camera's actual aspect, then scaled by `margin`; a box seen nearly flat therefore fills the frame rather than its bounding sphere. Near and far planes follow the distance.
 *
 * @param props Camera, world-space box to frame, preset name or angles, and margin (1 touches the frame edge)
 * @returns The point the camera looks at, for orbit controls
 *
 * @evidence contracts/common.md#principled-implementation Pinhole projection: a corner at lateral offset x and depth d toward the camera stays inside half-angle a when the eye distance is at least |x|/tan(a)+d, so the maximum over the eight corners and both axes is the tight fit.
 * @evidence contracts/common.md#clear-and-simple-design One function maps a named view and a box to a camera placement; choosing the box (whole or focus) stays with the page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No per-subject distance or offset is stored; framing follows the box alone, and the straight-view offset is a stated constant for a valid orbit basis.
 * @evidence contracts/common.md#meaningful-documentation Documents the frame convention, the angles' origin and sense, the straight views' image orientation, the fit rule, margin meaning and return value.
 * @evidence contracts/performance.md#efficient-algorithms Constant work: eight corners projected on a fixed basis.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call frames its arguments; there is no shared work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates a few vectors per call and retains nothing.
 */
export function frameHumanViewerCamera(props: {
  camera: THREE.PerspectiveCamera;
  box: THREE.Box3;
  view: frameHumanViewerCamera.View | frameHumanViewerCamera.IAngle;
  margin: number;
}): THREE.Vector3 {
  const target: THREE.Vector3 = props.box.getCenter(new THREE.Vector3());
  const angle: frameHumanViewerCamera.IAngle =
    typeof props.view === "string"
      ? frameHumanViewerCamera.PRESETS[props.view]
      : props.view;
  const azimuth: number = THREE.MathUtils.degToRad(angle.azimuth);
  const elevation: number = THREE.MathUtils.degToRad(angle.elevation);
  const direction: THREE.Vector3 = new THREE.Vector3(
    Math.sin(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.cos(azimuth) * Math.cos(elevation),
  );
  const straight: boolean = Math.abs(direction.y) > 0.999;
  if (straight) direction.add(new THREE.Vector3(0, 0, 1e-4)).normalize();

  // Camera basis looking along -direction with +Y up, as Object3D.lookAt builds it.
  const back: THREE.Vector3 = direction;
  const right: THREE.Vector3 = new THREE.Vector3()
    .crossVectors(new THREE.Vector3(0, 1, 0), back)
    .normalize();
  const up: THREE.Vector3 = new THREE.Vector3().crossVectors(back, right);

  const tanV: number = Math.tan(THREE.MathUtils.degToRad(props.camera.fov / 2));
  const tanH: number = tanV * props.camera.aspect;
  let distance: number = 0;
  const corner: THREE.Vector3 = new THREE.Vector3();
  for (let i: number = 0; i < 8; ++i) {
    corner
      .set(
        i & 1 ? props.box.max.x : props.box.min.x,
        i & 2 ? props.box.max.y : props.box.min.y,
        i & 4 ? props.box.max.z : props.box.min.z,
      )
      .sub(target);
    const depth: number = corner.dot(back);
    distance = Math.max(
      distance,
      Math.abs(corner.dot(right)) / tanH + depth,
      Math.abs(corner.dot(up)) / tanV + depth,
    );
  }
  distance *= props.margin;

  props.camera.up.set(0, 1, 0);
  props.camera.position.copy(target).addScaledVector(direction, distance);
  props.camera.near = Math.max(distance / 1000, 1e-4);
  props.camera.far = distance * 10;
  props.camera.lookAt(target);
  props.camera.updateProjectionMatrix();
  return target;
}
/**
 * Preset views of the camera framing and the angles any view is given by.
 *
 * @evidence contracts/common.md#principled-implementation The preset union is the key set of the angle table and its capture order, so a preset without angles does not compile; every other direction is the same two angles.
 * @evidence contracts/common.md#clear-and-simple-design The namespace keeps the view names and angles beside the function that places them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Views are named from the subject's side, never from a particular person's measurements.
 * @evidence contracts/common.md#meaningful-documentation Documents the angle convention, each preset's angles and the capture order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Unions and constant tables perform no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Unions and constant tables coordinate no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Constant tables of fourteen entries own no resource.
 */
export namespace frameHumanViewerCamera {
  /** A preset view, named from the subject's side. */
  export type View =
    | "front"
    | "frontLeft"
    | "left"
    | "backLeft"
    | "back"
    | "backRight"
    | "right"
    | "frontRight"
    | "frontLeftHigh"
    | "backRightHigh"
    | "frontRightLow"
    | "backLeftLow"
    | "top"
    | "below";

  /**
   * Direction from the subject to the eye.
   *
   * @author Samchon
   */
  export interface IAngle {
    /** Degrees around the vertical from the front toward the subject's left: 0 front, 90 left, 180 back, 270 right. */
    azimuth: number;

    /** Degrees above the horizontal, from -90 (straight up from below) to 90 (straight down from above). */
    elevation: number;
  }

  /**
   * Angles of each preset: the eight 45-degree azimuths on the horizontal turntable, two obliques 35 degrees above (front left, back right) and two 25 degrees below (front right, back left) so the four diagonals are each seen from above or below once, and the two straight views.
   */
  export const PRESETS: Record<View, IAngle> = {
    front: { azimuth: 0, elevation: 0 },
    frontLeft: { azimuth: 45, elevation: 0 },
    left: { azimuth: 90, elevation: 0 },
    backLeft: { azimuth: 135, elevation: 0 },
    back: { azimuth: 180, elevation: 0 },
    backRight: { azimuth: 225, elevation: 0 },
    right: { azimuth: 270, elevation: 0 },
    frontRight: { azimuth: 315, elevation: 0 },
    frontLeftHigh: { azimuth: 45, elevation: 35 },
    backRightHigh: { azimuth: 225, elevation: 35 },
    frontRightLow: { azimuth: 315, elevation: -25 },
    backLeftLow: { azimuth: 135, elevation: -25 },
    top: { azimuth: 0, elevation: 90 },
    below: { azimuth: 0, elevation: -90 },
  };

  /** Every preset view, in capture order: the turntable from the front toward the left, then the obliques, then the straight views. */
  export const VIEWS: readonly View[] = Object.keys(PRESETS) as View[];
}
