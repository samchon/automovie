import type { AutoMovieHumanSkeleton } from "@automovie/human";
import * as THREE from "three";

import type { InspectionPerson } from "./InspectionPerson";

/**
 * Bone-bound shorts and a distinct referee shirt/trousers silhouette.
 *
 * @evidence contracts/common.md#implementation-and-ownership Fighter sleeves cover the proximal half of each actual thigh using generated length/radius and the actual upper-leg bone group. Referee palette follows the original articulated body parts. No body proportion or joint transform is changed.
 * @evidence contracts/common.md#authoring-interface Role chooses commissioned clothing colors. Returned cleanup owns the added shorts meshes and materials; the person owns its original palette. These coarse garments are rigid rather than cloth simulation.
 */
export function addInspectionOutfit(
  person: InspectionPerson,
  role: "a" | "b" | "referee",
): () => void {
  const colors: Record<string, number> = {};
  for (const bone of person.neutral.bones) {
    if (role === "referee")
      colors[bone.bone] =
        /^(hips|leftUpperLeg|rightUpperLeg|leftLowerLeg|rightLowerLeg)|Foot|Subtalar|Midfoot|Toe|Hallux|Second|Third|Fourth|Fifth/.test(
          bone.bone,
        )
          ? 0x151b23
          : /^(head|neck|atlas)|Hand|Thumb|Index|Middle|Ring|Little/.test(
                bone.bone,
              )
            ? 0xb98367
            : 0xf0f0e8;
    else
      colors[bone.bone] =
        bone.bone === "hips"
          ? role === "a"
            ? 0xb51f2a
            : 0x142946
          : role === "a"
            ? 0xb98367
            : 0x75523f;
  }
  person.drawing.setPartColors(colors);
  const geometry: THREE.BufferGeometry[] = [];
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: role === "a" ? 0xc62a34 : 0x142946,
    roughness: 0.95,
  });
  const trim: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: role === "a" ? 0xf0e3ce : 0x28d6e0,
    roughness: 0.8,
  });
  const meshes: THREE.Mesh[] = [];
  if (role !== "referee")
    for (const side of ["left", "right"] as const) {
      const upper: AutoMovieHumanSkeleton.IBone | undefined =
        person.neutral.bones.find(
          (bone: AutoMovieHumanSkeleton.IBone): boolean =>
            bone.bone === `${side}UpperLeg`,
        );
      const knee: AutoMovieHumanSkeleton.IBone | undefined =
        person.neutral.bones.find(
          (bone: AutoMovieHumanSkeleton.IBone): boolean =>
            bone.bone === `${side}LowerLeg`,
        );
      const parent: THREE.Group | undefined = person.drawing.bones.get(
        `${side}UpperLeg`,
      );
      if (!upper || !knee || !parent)
        throw new Error(`Missing ${side} shorts binding`);
      const direction: THREE.Vector3 = new THREE.Vector3(...knee.position).sub(
        new THREE.Vector3(...upper.position),
      );
      const length: number = direction.length() * 0.49;
      direction.normalize();
      const cloth: THREE.CylinderGeometry = new THREE.CylinderGeometry(
        upper.radius * 1.12,
        upper.radius * 1.08,
        length,
        8,
      );
      const cuff: THREE.CylinderGeometry = new THREE.CylinderGeometry(
        upper.radius * 1.085,
        upper.radius * 1.085,
        0.025,
        8,
      );
      geometry.push(cloth, cuff);
      const shorts: THREE.Mesh = new THREE.Mesh(cloth, material);
      const band: THREE.Mesh = new THREE.Mesh(cuff, trim);
      shorts.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, -1, 0),
        direction,
      );
      band.quaternion.copy(shorts.quaternion);
      shorts.position.copy(direction.clone().multiplyScalar(length / 2));
      band.position.copy(direction.clone().multiplyScalar(length - 0.0125));
      parent.add(shorts, band);
      meshes.push(shorts, band);
    }
  return (): void => {
    for (const mesh of meshes) mesh.removeFromParent();
    for (const item of geometry) item.dispose();
    material.dispose();
    trim.dispose();
  };
}
