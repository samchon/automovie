import * as THREE from "three";

import { createRider } from "./createRider";
import { humanParameters } from "./humanParameters";

/**
 * Inspect the actual Human polygon adapter before dependent film staging.
 * This isolated mechanics view is not a film shot or an encoded delivery.
 *
 * @evidence contracts/common.md#implementation-and-ownership Uses the production rider adapter with public clinical FK/IK and a fixed support shaft. Records actual wrist residuals for the moving pose; owns scene-only lights and support resources and delegates rider disposal to its owner.
 * @evidence contracts/common.md#authoring-interface Returns the shared Viewer host scene/camera/seek/dispose shape. Seconds drive an absolute repeatable twelve-second reach loop; window.__motionDiagnostics exposes actual residuals, not visual acceptance.
 */
export function createMechanicsScene(): {
  scene: THREE.Scene; camera: THREE.PerspectiveCamera; seek: (seconds: number) => void; dispose: () => void;
} {
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa9bcc7);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 100);
  camera.position.set(3, 2, -4);
  camera.lookAt(0, 1.1, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x64795c, 2));
  const key: THREE.DirectionalLight = new THREE.DirectionalLight(0xffedcf, 2);
  key.position.set(2, 4, -3);
  scene.add(key);
  const rider: ReturnType<typeof createRider> = createRider(humanParameters(1.72, true), 0x315a48, true, false);
  scene.add(rider.object);
  const wood: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0x805632, roughness: 0.9 });
  const geometry: THREE.CylinderGeometry = new THREE.CylinderGeometry(0.028, 0.028, 2.4, 8);
  const broom: THREE.Mesh = new THREE.Mesh(geometry, wood);
  broom.rotation.z = Math.PI / 2;
  broom.position.set(0.2, 1, 0);
  scene.add(broom);
  const pelvis: THREE.Vector3 = new THREE.Vector3(0, 1.08, 0);
  return { scene, camera, seek, dispose };

  /** Sweep clinical lean while enforcing both wrist targets on the shaft. */
  function seek(seconds: number): void {
    const reach: number = (Math.sin(seconds * Math.PI / 6) + 1) / 2;
    const result: ReturnType<typeof rider.update> = rider.update({
      legs: { left: { hip: { flexion: 78, abduction: 25 }, knee: { flexion: 95 } }, right: { hip: { flexion: 78, abduction: 25 }, knee: { flexion: 95 } } },
      spine: { lumbar: { flexion: 28 + 8 * reach }, thoracic: { flexion: 8 } },
      arms: { left: { shoulder: { flexion: 65 }, elbow: { flexion: 65 } }, right: { shoulder: { flexion: 65 }, elbow: { flexion: 65 } } },
    }, pelvis, { left: new THREE.Vector3(0.18, 1.04, 0.045), right: new THREE.Vector3(0.25, 1.04, -0.045) });
    Object.assign(window, { __motionDiagnostics: { seconds, ...result, wristLeft: rider.point("leftHand").toArray(), wristRight: rider.point("rightHand").toArray() } });
    scene.updateMatrixWorld(true);
  }

  /** Release owned display resources without touching the Viewer renderer. */
  function dispose(): void {
    rider.dispose(); geometry.dispose(); wood.dispose(); scene.clear();
  }
}
