import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { createAutoMovieClosedSphereGeometry } from "@automovie/viewer";
import * as THREE from "three";

import type { InspectionPerson } from "./InspectionPerson";

/**
 * Bind visible padded equipment to the two actual Human hand groups.
 *
 * @evidence contracts/common.md#implementation-and-ownership The actual declared glove collider supplies the Hand-local attachment transform. Public Viewer sphere construction preserves the original UV-split triangles while making periodic position/normal samples exact. The drawing's Hand group applies the posed transform once; equipment is owned by the returned disposer.
 * @evidence contracts/common.md#authoring-interface Size is an authored glove exterior in metres, not an anatomical contact proxy. The caller must inspect finger containment, wrist alignment and actual surface contacts after posing.
 */
export function addInspectionGloves(
  person: InspectionPerson,
  color: number,
  profile: Pick<P, "segments">,
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
    const shape: P.IShape | undefined = profile.segments
      .find((segment: P.ISegment): boolean => segment.bone === `${side}Hand`)
      ?.shapes.find(
        (candidate: P.IShape): boolean => candidate.material === "glove",
      );
    const parent: THREE.Group | undefined = person.drawing.bones.get(
      `${side}Hand`,
    );
    if (!shape || !parent)
      throw new Error(`Missing declared ${side} glove binding`);
    const glove: THREE.Mesh = new THREE.Mesh(geometry, material);
    glove.name = `${side}-glove`;
    glove.scale.set(0.105, 0.095, 0.095);
    glove.position.set(
      shape.transform.position.x,
      shape.transform.position.y,
      shape.transform.position.z,
    );
    glove.quaternion.set(
      shape.transform.rotation.x,
      shape.transform.rotation.y,
      shape.transform.rotation.z,
      shape.transform.rotation.w,
    );
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
