import * as THREE from "three";

/**
 * Own camera presets and fitting independently from face identity and GPU IO.
 * The model getter supplies the currently displayed nonempty static group.
 * A sphere enclosing all three dimensions stays inside both perspective cones
 * at every orbit angle. Optical zoom, orbit limits and clipping planes follow
 * that same fit, including hair extending behind the cranial surface.
 * A collapsed viewport retains a finite projection until it becomes visible.
 *
 * @evidence contracts/common.md#principled-implementation Fits a bounding sphere inside the tighter effective horizontal/vertical perspective cone with a 1.1 display margin, then updates orbit distance and clip range. The current group must have finite strictly positive world bounds and the camera valid native lens state; a zero-radius group can otherwise produce zero near distance, and very narrow/extreme fields can overflow arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design One camera owner shares distance between fit and azimuth presets, using the actual displayed group getter instead of face/body identity constants. Host canvas sizing remains an explicit setSize callback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The default 0.65 distance, 0.02 vertical offset, margin and clip floors are authored display framing conventions. Bounds include the entire supplied group rather than dropping hair to fit a fixture; fitting proves a geometric envelope under its premises, not visible beauty or supported controls on an unobserved UI.
 * @evidence contracts/common.md#meaningful-documentation The comment states metre-scale native fit, optical zoom and orbit-clamp coordination, static-group premise and finite aspect retention for collapsed dimensions. Missing model is a no-op and original scene/camera ownership stays with the host.
 * @evidence contracts/performance.md#efficient-algorithms Preset and resize writes are fixed work; fitting traverses native object bounds, whose cost depends on object hierarchy/geometry bound availability. No second anatomical mesh or numerical solver is built for framing.
 * @evidence contracts/performance.md#reuse-equivalent-work Presets reuse the current fit distance and orbit target. Fit rereads the currently displayed group when requested; resize updates aspect/projection but does not automatically refit a previously sized model.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned callbacks borrow camera, controls, model getter and sizing port. Temporary Box3/Sphere/vector values acquire no GPU handles; the viewport owns these service references until closure.
 */
export function createHumanPreviewCamera(props: {
  camera: THREE.PerspectiveCamera;
  orbit: {
    target: THREE.Vector3;
    maxDistance?: number;
    update: () => unknown;
  };
  model: () => THREE.Group | undefined;
  setSize: (width: number, height: number) => void;
}): { cameraView: (degrees: number) => void; fitView: () => void; resize: (width: number, height: number) => void; } {
  const { camera, orbit }: { camera: THREE.PerspectiveCamera; orbit: { target: THREE.Vector3; maxDistance?: number; update: () => unknown; }; model: () => THREE.Group | undefined; setSize: (width: number, height: number) => void; } = props;
  let distance: number = 0.65;
  const cameraView: (degrees: number) => void = (degrees: number): void => {
    const radians: number = (degrees * Math.PI) / 180;
    camera.position.set(
      orbit.target.x + Math.sin(radians) * distance,
      orbit.target.y + 0.02,
      orbit.target.z + Math.cos(radians) * distance,
    );
    orbit.update();
  };
  const fitView: () => void = (): void => {
    const model: THREE.Group<THREE.Object3DEventMap> | undefined = props.model();
    if (model === undefined) return;
    const bounds: THREE.Box3 = new THREE.Box3().setFromObject(model);
    bounds.getCenter(orbit.target);
    const radius: number = bounds.getBoundingSphere(new THREE.Sphere()).radius;
    const vertical: number = THREE.MathUtils.degToRad(camera.getEffectiveFOV() / 2);
    const horizontal: number = Math.atan(Math.tan(vertical) * camera.aspect);
    distance = (1.1 * radius) / Math.sin(Math.min(vertical, horizontal));
    // OrbitControls clamps even an explicitly positioned camera during update.
    // An old zoom-out cap must not undo the fit before its first frame.
    orbit.maxDistance = Math.max(
      orbit.maxDistance ?? Infinity,
      Math.hypot(distance, 0.02),
    );
    camera.near = Math.min(0.01, (distance - radius) / 2);
    camera.far = Math.max(10, 2 * (distance + radius));
    camera.updateProjectionMatrix();
    cameraView(0);
  };
  const resize: (width: number, height: number) => void = (width: number, height: number): void => {
    props.setSize(width, height);
    camera.aspect = Math.max(1, width) / Math.max(1, height);
    camera.updateProjectionMatrix();
  };
  return { cameraView, fitView, resize };
}
