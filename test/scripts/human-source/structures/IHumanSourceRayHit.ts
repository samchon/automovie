/**
 * Where a ray meets one oriented triangle: the triangle's corner IDs in their
 * stored order, the barycentric weights `(1 - u - v, u, v)`, the ray
 * parameter and whether the triangle's normal faces along the ray.
 *
 * @author Samchon
 */
export interface IHumanSourceRayHit {
  /** Corner vertex IDs in stored order. */
  triangle: [number, number, number];

  /** Barycentric weight of the second corner. */
  u: number;

  /** Barycentric weight of the third corner. */
  v: number;

  /** Ray parameter of the hit, metres along the unit direction. */
  t: number;

  /** Whether the triangle's (b - a) x (c - a) normal has a positive dot with the direction. */
  facing: boolean;
}
