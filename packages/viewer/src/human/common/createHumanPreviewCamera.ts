import * as THREE from "three";

/**
 * Own camera presets and fitting independently from face identity and GPU IO.
 * The model getter supplies the currently displayed nonempty static group.
 * A sphere enclosing all three dimensions stays inside both perspective cones
 * at every orbit angle. Optical zoom, orbit limits and clipping planes follow
 * that same fit, including hair extending behind the cranial surface.
 * A collapsed viewport retains a finite projection until it becomes visible.
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
}) {
  const { camera, orbit } = props;
  let distance = 0.65;
  const cameraView = (degrees: number): void => {
    const radians = (degrees * Math.PI) / 180;
    camera.position.set(
      orbit.target.x + Math.sin(radians) * distance,
      orbit.target.y + 0.02,
      orbit.target.z + Math.cos(radians) * distance,
    );
    orbit.update();
  };
  const fitView = (): void => {
    const model = props.model();
    if (model === undefined) return;
    const bounds = new THREE.Box3().setFromObject(model);
    bounds.getCenter(orbit.target);
    const radius = bounds.getBoundingSphere(new THREE.Sphere()).radius;
    const vertical = THREE.MathUtils.degToRad(camera.getEffectiveFOV() / 2);
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
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
  const resize = (width: number, height: number): void => {
    props.setSize(width, height);
    camera.aspect = Math.max(1, width) / Math.max(1, height);
    camera.updateProjectionMatrix();
  };
  return { cameraView, fitView, resize };
}
