import * as THREE from "three";

/**
 * Fit actual subject bounds from one fixed, unobstructed front-right camera station.
 *
 * @evidence contracts/common.md#implementation-and-ownership Actual current object bounds determine the centre and the perspective angle required by all eight corners at the adopted aspect. The camera remains at its explicit staging station; no subject is scaled. This geometric fit does not prove pixel visibility or absence of occlusion.
 * @evidence contracts/common.md#authoring-interface Supply current subjects, the camera and a fixed unobstructed world-space station, including a station inside the clear bay. Margin is the positive fraction of screen usable below one. Camera near/far must accommodate the resulting placement. Rendered framing and occlusion must still be inspected.
 */
export function fitPerformanceCamera(camera: THREE.PerspectiveCamera, subjects: THREE.Object3D[], station: THREE.Vector3, margin: number = 0.86): void {
  if (subjects.length === 0 || !Number.isFinite(margin) || margin <= 0 || margin >= 1 || !station.toArray().every(Number.isFinite))
    throw new Error("Camera fit requires subjects, a station and a unit-range margin");
  const bounds: THREE.Box3 = new THREE.Box3();
  for (const subject of subjects) bounds.union(new THREE.Box3().setFromObject(subject, true));
  if (bounds.isEmpty()) throw new Error("Camera subjects have no bounds");
  const centre: THREE.Vector3 = bounds.getCenter(new THREE.Vector3());
  camera.position.copy(station);
  camera.lookAt(centre);
  camera.updateMatrixWorld(true);
  let slope: number = 0;
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
    const point: THREE.Vector3 = new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse);
    if (point.z >= -camera.near) throw new Error("Camera fit crosses a subject");
    slope = Math.max(slope, Math.abs(point.y / point.z) / margin, Math.abs(point.x / point.z) / (margin * camera.aspect));
  }
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(slope));
  camera.updateProjectionMatrix();
}
