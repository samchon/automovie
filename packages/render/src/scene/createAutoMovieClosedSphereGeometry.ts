import * as THREE from "three";

import { AUTOMOVIE_FLOAT32_MAX } from "./AUTOMOVIE_FLOAT32_MAX.js";

/**
 * Create a complete sphere with one exact positional sample at its periodic
 * seam.
 *
 * Finite segment counts use Three's floor/minimum normalization. The two UV
 * columns still have separate indices and texture coordinates, but the last
 * column reuses the first column's position and normal at the same longitude.
 * This preserves exact closure after a shared rigid world transform. Nonfinite
 * Float32 output, zero normals or collapsed indexed triangles refuse; the
 * admissible radius therefore also depends on the requested tessellation.
 *
 * @param radius Positive finite local-metre radius with representable,
 *   nondegenerate output.
 * @param widthSegments Finite longitude count, floored with minimum three.
 * @param heightSegments Finite latitude count, floored with minimum two.
 * @returns Caller-owned SphereGeometry; dispose it when its consumers retire.
 */
export function createAutoMovieClosedSphereGeometry(
  radius: number = 1,
  widthSegments: number = 32,
  heightSegments: number = 16,
): THREE.SphereGeometry {
  // Every position has magnitude at most the radius, stored as float32.
  if (!(radius > 0 && radius <= AUTOMOVIE_FLOAT32_MAX))
    throw new Error(
      "A closed sphere requires a positive finite radius and finite segment counts",
    );
  const geometry: THREE.SphereGeometry = new THREE.SphereGeometry(
    radius,
    widthSegments,
    heightSegments,
  );
  const width: number = Math.max(3, Math.floor(widthSegments));
  const height: number = Math.max(2, Math.floor(heightSegments));
  const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    geometry.getAttribute("position");
  const normal: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    geometry.getAttribute("normal");

  // A full turn shares the same exact sample; UV coordinates remain distinct.
  for (let row: number = 0; row <= height; row++) {
    const first: number = row * (width + 1);
    const last: number = first + width;
    position.setXYZ(
      last,
      position.getX(first),
      position.getY(first),
      position.getZ(first),
    );
    normal.setXYZ(
      last,
      normal.getX(first),
      normal.getY(first),
      normal.getZ(first),
    );
  }
  position.needsUpdate = true;
  normal.needsUpdate = true;
  const origin: THREE.Vector3 = new THREE.Vector3();
  const firstEdge: THREE.Vector3 = new THREE.Vector3();
  const secondEdge: THREE.Vector3 = new THREE.Vector3();

  // A radius that fits Float32 keeps every position finite, and a normal is a unit vector; only a tiny radius can collapse a triangle at stored precision.
  const indices: THREE.BufferAttribute = geometry.index!;

  // Float32 edge products and their squares fit in doubles even at subnormal scale.
  for (let triangle: number = 0; triangle < indices.count; triangle += 3) {
    origin.fromBufferAttribute(position, indices.getX(triangle));
    firstEdge
      .fromBufferAttribute(position, indices.getX(triangle + 1))
      .sub(origin);
    secondEdge
      .fromBufferAttribute(position, indices.getX(triangle + 2))
      .sub(origin);
    if (firstEdge.cross(secondEdge).lengthSq() === 0) {
      geometry.dispose();
      throw new Error(
        "A closed sphere requires nondegenerate triangles at stored precision",
      );
    }
  }
  return geometry;
}
