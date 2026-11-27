import * as THREE from "three";

import { AutoMovieThreeKind } from "../../AutoMovieThreeKind.js";
import { isAutoMovieFloat32Point } from "../../inspection/isAutoMovieFloat32Point.js";
import { readAutoMovieBufferAttribute } from "../../internal/readAutoMovieBufferAttribute.js";
import type { AutoMovieHumanPolygon } from "../../AutoMovieHumanPolygon.js";

/*
 * Bake and mount the original cartoon marks on the actual polygon front.
 */
export function mountHumanCartoonFace(
  object: THREE.Group,
  head: Pick<AutoMovieHumanPolygon.IDrawing["head"], "min" | "max" | "frontAt">,
): void {
  const centreZ: number = (head.min[2] + head.max[2]) / 2;
  for (const child of object.children) {
    if (!AutoMovieThreeKind.isMesh(child))
      throw new Error("A cartoon face part must be a mesh");
    const part: THREE.Mesh = child;
    part.updateMatrix();
    part.geometry.applyMatrix4(part.matrix);
    const positions: THREE.BufferAttribute = readAutoMovieBufferAttribute(
      part.geometry,
      "position",
    );
    for (let i: number = 0; i < positions.count; i++) {
      const y: number = THREE.MathUtils.clamp(
        positions.getY(i),
        head.min[1],
        head.max[1],
      );
      const requestedZ: number = positions.getZ(i);
      let z: number = requestedZ;
      let x: number | undefined = head.frontAt(y, z);
      if (x === undefined) {
        x = head.frontAt(y, centreZ);
        if (x === undefined)
          throw new Error(
            "Polygon front has no centre support for a cartoon mark",
          );
        z = centreZ;
        let inside: number = 0;
        let outside: number = 1;
        // Resolve the projected silhouette to one part in 2^16 of mark width.
        for (let step: number = 0; step < 16; step++) {
          const fraction: number = (inside + outside) / 2;
          const candidateZ: number =
            centreZ + (requestedZ - centreZ) * fraction;
          const candidateX: number | undefined = head.frontAt(y, candidateZ);
          if (candidateX === undefined) outside = fraction;
          else {
            inside = fraction;
            z = candidateZ;
            x = candidateX;
          }
        }
      }
      const mountedX: number = x + positions.getX(i) - head.max[0];
      if (!isAutoMovieFloat32Point(new THREE.Vector3(mountedX, y, z)))
        throw new Error(
          "Cartoon attachment exceeds finite Float32 coordinates",
        );
      positions.setXYZ(i, mountedX, y, z);
    }
    positions.needsUpdate = true;
    part.geometry.computeVertexNormals();
    part.geometry.computeBoundingBox();
    part.geometry.computeBoundingSphere();
    part.position.set(0, 0, 0);
    part.quaternion.identity();
    part.scale.set(1, 1, 1);
    part.updateMatrix();
  }
}
