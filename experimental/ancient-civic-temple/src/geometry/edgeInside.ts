import { HeightPlane } from "./HeightPlane";
import { PlanPoint } from "./PlanPoint";

/** The half-plane whose inside is left of a CCW edge. No normalization is needed. */

export const edgeInside = (a: PlanPoint, b: PlanPoint): HeightPlane => ({
  x: a.z - b.z,
  z: b.x - a.x,
  constant: (b.z - a.z) * a.x - (b.x - a.x) * a.z,
});
