import * as THREE from "three";

import type { InspectionPerson } from "./InspectionPerson";

/**
 * Read real displayed mesh vertices and bone positions for one static pose.
 *
 * @evidence contracts/common.md#implementation-and-ownership Traverses the actual emitted polygon meshes after world-matrix refresh. Full foot vertex extrema expose floating and penetration without treating a joint centre as the sole.
 * @evidence contracts/common.md#authoring-interface Returns world-metre bounds and exact FK landmarks; extrema and glove bounds are not a support polygon, force, contact or moving-picture certificate.
 */
export function inspectPersonGeometry(person: InspectionPerson): object {
  person.object.updateWorldMatrix(true, true);
  const feet: Record<
    string,
    { min: number[]; max: number[]; vertices: number }
  > = {};
  for (const side of ["left", "right"] as const) {
    const bounds: THREE.Box3 = new THREE.Box3();
    let vertices: number = 0;
    for (const [bone, mesh] of person.drawing.parts) {
      if (
        !bone.startsWith(side) ||
        !/(Foot|Subtalar|Midfoot|Toe|Hallux|Second|Third|Fourth|Fifth)/.test(
          bone,
        )
      )
        continue;
      const positions:
        | THREE.BufferAttribute
        | THREE.InterleavedBufferAttribute =
        mesh.geometry.getAttribute("position");
      for (let i: number = 0; i < positions.count; i++) {
        const point: THREE.Vector3 = new THREE.Vector3()
          .fromBufferAttribute(positions, i)
          .applyMatrix4(mesh.matrixWorld);
        bounds.expandByPoint(point);
        vertices++;
      }
    }
    feet[side] = {
      min: bounds.min.toArray(),
      max: bounds.max.toArray(),
      vertices,
    };
  }
  const gloves: object[] = [];
  person.object.traverse((object: THREE.Object3D): void => {
    if (!object.name.endsWith("-glove")) return;
    const bounds: THREE.Box3 = new THREE.Box3().setFromObject(object, true);
    gloves.push({
      name: object.name,
      parent: object.parent?.name,
      center: object.getWorldPosition(new THREE.Vector3()).toArray(),
      min: bounds.min.toArray(),
      max: bounds.max.toArray(),
    });
  });
  return {
    root: person.object.position.toArray(),
    feet,
    gloves,
    headBounds: new THREE.Box3().setFromObject(
      person.drawing.head.object,
      true,
    ),
    head: person.point("head"),
    leftShoulder: person.point("leftUpperArm"),
    rightShoulder: person.point("rightUpperArm"),
    leftHand: person.point("leftHand"),
    rightHand: person.point("rightHand"),
    leftElbow: person.point("leftLowerArm"),
    rightElbow: person.point("rightLowerArm"),
    leftKnee: person.point("leftLowerLeg"),
    rightKnee: person.point("rightLowerLeg"),
    clamps: person.output.clamped,
  };
}
