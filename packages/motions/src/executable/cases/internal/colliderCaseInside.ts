import * as THREE from "three";

/**
 * Whether a point lies inside a closed triangle mesh, by ray parity: a ray from
 * the point crosses a closed surface an odd number of times exactly when the
 * point is inside (the Jordan curve theorem's parity rule).
 *
 * @param p The point.
 * @param triangles The closed mesh's triangles, both faces counted.
 * @returns True inside.
 */
export function colliderCaseInside(
  p: THREE.Vector3,
  triangles: readonly THREE.Triangle[],
): boolean {
  const ray: THREE.Ray = new THREE.Ray(p, RAY);
  const at: THREE.Vector3 = new THREE.Vector3();
  let hits: number = 0;
  for (const triangle of triangles)
    if (
      ray.intersectTriangle(triangle.a, triangle.b, triangle.c, false, at) !==
      null
    )
      hits++;
  return hits % 2 === 1;
}

/** A fixed direction no drawn edge or face is parallel to, for the parity test. */
const RAY: THREE.Vector3 = new THREE.Vector3(
  0.5371,
  0.7193,
  0.4402,
).normalize();
