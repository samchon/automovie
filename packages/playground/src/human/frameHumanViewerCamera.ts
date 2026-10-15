import * as THREE from "three";

/**
 * Place a perspective camera on a preset view so a box fills the frame.
 *
 * Views are named from the subject's side, in the humanoid rest frame where the subject faces +Z and its left is +X: `front` looks at the face, `left` at the subject's left side, the three-quarter views sit 45 degrees between the front and that side, and `top` and `below` look straight down and up with the front toward the bottom and the top of the image respectively. Straight views keep `camera.up` at +Y and offset the eye by 1e-4 of the distance along +Z, so orbit controls stay valid and the image orientation is fixed.
 *
 * The distance is the smallest that keeps every corner of the box inside both the vertical and horizontal field of view, from the camera's actual aspect, then scaled by `margin`; a box seen nearly flat therefore fills the frame rather than its bounding sphere. Near and far planes follow the distance.
 *
 * @param props Camera, world-space box to frame, view and margin (1 touches the frame edge)
 * @returns The point the camera looks at, for orbit controls
 *
 * @evidence contracts/common.md#principled-implementation Pinhole projection: a corner at lateral offset x and depth d toward the camera stays inside half-angle a when the eye distance is at least |x|/tan(a)+d, so the maximum over the eight corners and both axes is the tight fit.
 * @evidence contracts/common.md#clear-and-simple-design One function maps a named view and a box to a camera placement; choosing the box (whole or focus) stays with the page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No per-subject distance or offset is stored; framing follows the box alone, and the straight-view offset is a stated constant for a valid orbit basis.
 * @evidence contracts/common.md#meaningful-documentation Documents the frame convention, each view's direction and image orientation, the fit rule, margin meaning and return value.
 * @evidence contracts/performance.md#efficient-algorithms Constant work: eight corners projected on a fixed basis.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call frames its arguments; there is no shared work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates a few vectors per call and retains nothing.
 */
export function frameHumanViewerCamera(props: {
  camera: THREE.PerspectiveCamera;
  box: THREE.Box3;
  view: frameHumanViewerCamera.View;
  margin: number;
}): THREE.Vector3 {
  const target: THREE.Vector3 = props.box.getCenter(new THREE.Vector3());
  const direction: THREE.Vector3 = DIRECTIONS[props.view].clone().normalize();
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
 * Preset views of the camera framing.
 *
 * @evidence contracts/common.md#principled-implementation The view union and its capture order are the closed set the direction table is keyed by, so a view without a direction does not compile.
 * @evidence contracts/common.md#clear-and-simple-design The namespace keeps the view names beside the function that places them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Views are named from the subject's side, never from a particular person's measurements.
 * @evidence contracts/common.md#meaningful-documentation Documents the view naming and the capture order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A union and a constant list perform no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A union and a constant list coordinate no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A constant list of eight names owns no resource.
 */
export namespace frameHumanViewerCamera {
  /** A preset view, named from the subject's side. */
  export type View =
    | "front"
    | "back"
    | "left"
    | "right"
    | "frontLeft"
    | "frontRight"
    | "top"
    | "below";

  /** Every preset view, in capture order. */
  export const VIEWS: readonly View[] = [
    "front",
    "back",
    "left",
    "right",
    "frontLeft",
    "frontRight",
    "top",
    "below",
  ];
}

/** Direction from the target to the eye per view, subject facing +Z, its left +X. */
const DIRECTIONS: Record<frameHumanViewerCamera.View, THREE.Vector3> = {
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
  left: new THREE.Vector3(1, 0, 0),
  right: new THREE.Vector3(-1, 0, 0),
  frontLeft: new THREE.Vector3(1, 0, 1),
  frontRight: new THREE.Vector3(-1, 0, 1),
  top: new THREE.Vector3(0, 1, 0),
  below: new THREE.Vector3(0, -1, 0),
};
