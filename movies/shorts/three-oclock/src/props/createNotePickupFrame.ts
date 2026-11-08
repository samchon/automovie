import * as THREE from "three";

/**
 * Plan a finite edge tip before a flat note permits an opposed-finger grip.
 *
 * @evidence contracts/common.md#implementation-and-ownership Copies the actual sheet bounds/rest matrix and fixes the far lower short-edge line on the paving. A bounded35degree rigid tip raises the near edge while all eight real box corners stay above the same floor. This is authored contact-guided kinematics, not a friction, adhesion or force simulation. It avoids placing the closing thumb beneath a still-flat floor-bound note. The scene must establish actual index contact before consuming the tip and actual opposed contact before releasing the floor owner.
 * @evidence contracts/common.md#authoring-interface Supply the actual unscaled2mm rectangular note at its flat rest transform. A normal toward world+Y and initially nonnegative floor are required. at takes a0–1 tip phase and returns a fresh rigid world matrix, measured minimum and unchanged far-edge pivot. It never moves the mesh or grants ownership. Subsequent lift/hand transport belongs to the coupled performance and its original skin/contact checks.
 */
export function createNotePickupFrame(paper: THREE.Mesh): {
  rest: THREE.Matrix4;
  at: (phase: number) => { matrix: THREE.Matrix4; floorMinimum: number; pivot: THREE.Vector3 };
} {
  paper.updateWorldMatrix(true, false); paper.geometry.computeBoundingBox();
  const bounds: THREE.Box3 | null = paper.geometry.boundingBox;
  if (bounds === null || paper.geometry.type !== "BoxGeometry") throw new Error("Pickup needs the actual finite rectangular sheet");
  const position: THREE.Vector3 = new THREE.Vector3(); const rotation: THREE.Quaternion = new THREE.Quaternion(); const scale: THREE.Vector3 = new THREE.Vector3();
  paper.matrixWorld.decompose(position, rotation, scale);
  if (!paper.matrixWorld.elements.every(Number.isFinite) || scale.toArray().some((value: number): boolean => Math.abs(value - 1) > 1e-6) || new THREE.Vector3(1, 0, 0).applyQuaternion(rotation).y < 0.999999)
    throw new Error("Pickup rest frame must be rigid and flat with positiveY thickness normal");
  const corners: THREE.Vector3[] = [];
  for (let index: number = 0; index < 8; index++) corners.push(new THREE.Vector3(index & 1 ? bounds.max.x : bounds.min.x, index & 2 ? bounds.max.y : bounds.min.y, index & 4 ? bounds.max.z : bounds.min.z));
  const far: THREE.Vector3 = new THREE.Vector3(bounds.min.x, bounds.max.y, 0);
  const pivot: THREE.Vector3 = far.clone().applyMatrix4(paper.matrixWorld);
  const axis: THREE.Vector3 = new THREE.Vector3(0, 0, 1).applyQuaternion(rotation).normalize();
  if (Math.min(...corners.map((corner: THREE.Vector3): number => corner.clone().applyMatrix4(paper.matrixWorld).y)) < -1e-8 || Math.abs(pivot.y) > 1e-7)
    throw new Error("The actual far lower edge does not rest on this paving");
  return { rest: paper.matrixWorld.clone(), at: (phase: number): { matrix: THREE.Matrix4; floorMinimum: number; pivot: THREE.Vector3 } => {
    if (!Number.isFinite(phase) || phase < 0 || phase > 1) throw new Error("Note tip phase must lie within0–1");
    const turn: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(35) * phase).multiply(rotation);
    const centre: THREE.Vector3 = pivot.clone().sub(far.clone().applyQuaternion(turn));
    const matrix: THREE.Matrix4 = new THREE.Matrix4().compose(centre, turn, new THREE.Vector3(1, 1, 1));
    return { matrix, pivot: pivot.clone(), floorMinimum: Math.min(...corners.map((corner: THREE.Vector3): number => corner.clone().applyMatrix4(matrix).y)) };
  } };
}
