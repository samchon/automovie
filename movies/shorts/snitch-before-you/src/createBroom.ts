import * as THREE from "three";

/**
 * Build the production's 2.4 metre broom along local +X, seat at the origin.
 * The rear 0.65 metre shaft stays clear before its bristles.
 *
 * @evidence contracts/common.md#implementation-and-ownership Owns a project-authored rigid wood/bristle representation from settings/brooms.md#flight; has no flight simulation or self-return behavior. All owned resources are disposed explicitly.
 * @evidence contracts/common.md#authoring-interface Returns a group to place in world metres and a disposer. The shaft runs from -0.65 to +1.15 metres; the rear bristle tip reaches -1.25, for 2.4 metres overall.
 */
export function createBroom(): { object: THREE.Group; dispose: () => void } {
  const object: THREE.Group = new THREE.Group();
  const wood: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0x8c6139, roughness: 0.9 });
  const bristle: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0x4e3c2b, roughness: 1 });
  const shaftGeometry: THREE.CylinderGeometry = new THREE.CylinderGeometry(0.026, 0.026, 1.8, 8);
  const shaft: THREE.Mesh = new THREE.Mesh(shaftGeometry, wood);
  shaft.rotation.z = -Math.PI / 2;
  shaft.position.x = 0.25;
  object.add(shaft);
  const brushGeometry: THREE.ConeGeometry = new THREE.ConeGeometry(0.13, 0.6, 7);
  const brush: THREE.Mesh = new THREE.Mesh(brushGeometry, bristle);
  brush.rotation.z = -Math.PI / 2;
  brush.position.x = -0.95;
  object.add(brush);
  return { object, dispose: (): void => { shaftGeometry.dispose(); brushGeometry.dispose(); wood.dispose(); bristle.dispose(); object.clear(); } };
}
