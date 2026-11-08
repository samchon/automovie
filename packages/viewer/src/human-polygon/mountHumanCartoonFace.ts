import * as THREE from "three";

import type { AutoMovieHumanPolygon } from "./AutoMovieHumanPolygon.js";

/**
 * Bake and mount the original cartoon marks on the actual polygon front.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Preserves original primitive-transform baking, head-local triangle-front sampling, sixteen-step silhouette bisection and finite float32 checks without changing drawing coefficients.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass separates actual-front mounting from mark selection and resource lifetime; the caller disposes its drawing on refusal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Samples the supplied actual triangle surface instead of a fitted head or hidden offset proxy; original silhouette clamping is retained as an explicit cartoon drawing convention.
 * @evidence contracts/development/common.md#meaningful-documentation States original mounting preservation, actual-front ownership and caller failure cleanup.
 * @evidence contracts/development/implementation.md#efficient-algorithms Visits each mark vertex and performs one front query, plus at most seventeen additional queries outside the silhouette; each borrowed front query scans its indexed head triangles.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Mutates the original mark geometry and reuses its current posed head attachment without making another surface.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows head/object only during the pass and acquires no separately retained geometry, material, task or renderer.
 */
export function mountHumanCartoonFace(
  object: THREE.Group,
  head: Pick<AutoMovieHumanPolygon.IDrawing["head"], "min" | "max" | "frontAt">,
): void {
  const centreZ: number = (head.min[2] + head.max[2]) / 2;
  for (const child of object.children) {
    const part: THREE.Mesh = child as THREE.Mesh;
    part.updateMatrix();
    part.geometry.applyMatrix4(part.matrix);
    const positions: THREE.BufferAttribute = part.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    for (let i: number = 0; i < positions.count; i++) {
      if (
        !Number.isFinite(positions.getX(i)) ||
        !Number.isFinite(positions.getY(i)) ||
        !Number.isFinite(positions.getZ(i))
      )
        throw new Error("Cartoon mark exceeds finite geometry coordinates");
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
      if (!Number.isFinite(x))
        throw new Error(
          "Polygon front returned a non-finite cartoon attachment",
        );
      const mountedX: number = x + positions.getX(i) - head.max[0];

      // Refuse numeric storage overflow without restoring clinical pose limits.
      if (
        !Number.isFinite(Math.fround(mountedX)) ||
        !Number.isFinite(Math.fround(y)) ||
        !Number.isFinite(Math.fround(z))
      )
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
