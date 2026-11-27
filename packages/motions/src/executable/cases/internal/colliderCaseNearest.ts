import * as THREE from "three";

/*
 * The distance from a point to the nearest of some triangles, metres: the least
 * distance to each triangle's closest point.
 * Parameter p: The point.
 * Parameter triangles: The triangles.
 * Returns: Metres; infinite when there is no triangle.
 */
export function colliderCaseNearest(
  p: THREE.Vector3,
  triangles: readonly THREE.Triangle[],
): number {
  const at: THREE.Vector3 = new THREE.Vector3();
  let best: number = Infinity;
  for (const triangle of triangles)
    best = Math.min(best, triangle.closestPointToPoint(p, at).distanceTo(p));
  return best;
}
