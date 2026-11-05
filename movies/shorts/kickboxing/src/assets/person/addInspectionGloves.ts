import type { AutoMovieHumanSkeleton } from "@automovie/human";
import { createAutoMovieClosedSphereGeometry } from "@automovie/viewer";
import * as THREE from "three";

import type { InspectionPerson } from "./InspectionPerson";

/**
 * Bind visible padded equipment to the two actual Human hand groups.
 *
 * @evidence contracts/common.md#implementation-and-ownership The neutral posed elbow-to-wrist vector is converted into the actual Hand frame before binding. Public Viewer sphere construction preserves the original UV-split triangles while making periodic position/normal samples exact. The original drawing's real Hand group applies the posed transform once; equipment is owned by the returned disposer.
 * @evidence contracts/common.md#authoring-interface Size is an authored glove exterior in metres, not an anatomical contact proxy. The caller must inspect finger containment, wrist alignment and actual surface contacts after posing.
 */
export function addInspectionGloves(
  person: InspectionPerson,
  color: number,
): () => void {
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
  });
  const geometry: THREE.SphereGeometry = createAutoMovieClosedSphereGeometry(
    1,
    16,
    12,
  );
  const gloves: THREE.Mesh[] = [];
  for (const side of ["left", "right"] as const) {
    const hand: AutoMovieHumanSkeleton.IPlacement | undefined =
      person.neutral.posed.find(
        (bone: AutoMovieHumanSkeleton.IPlacement): boolean =>
          bone.bone === `${side}Hand`,
      );
    const forearm: AutoMovieHumanSkeleton.IPlacement | undefined =
      person.neutral.posed.find(
        (bone: AutoMovieHumanSkeleton.IPlacement): boolean =>
          bone.bone === `${side}LowerArm`,
      );
    const parent: THREE.Group | undefined = person.drawing.bones.get(
      `${side}Hand`,
    );
    if (!hand || !forearm || !parent)
      throw new Error(`Missing actual ${side} hand binding`);
    const direction: THREE.Vector3 = new THREE.Vector3(...hand.position)
      .sub(new THREE.Vector3(...forearm.position))
      .normalize()
      .applyQuaternion(new THREE.Quaternion(...hand.rotation).invert());
    const glove: THREE.Mesh = new THREE.Mesh(geometry, material);
    glove.name = `${side}-glove`;
    glove.scale.set(0.105, 0.095, 0.095);
    glove.position.copy(direction.multiplyScalar(0.065));
    glove.castShadow = true;
    parent.add(glove);
    gloves.push(glove);
  }
  return (): void => {
    for (const glove of gloves) glove.removeFromParent();
    geometry.dispose();
    material.dispose();
  };
}
