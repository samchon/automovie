import type {
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMoviePrincipalTensorFrame,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { physicalInertiaTensor } from "../physicalInertiaTensor";
import { physicalPrincipalAxes } from "../physicalPrincipalAxes";

/**
 * Combine rotated inertia tensors using the parallel-axis theorem. A
 * dimensionless Jacobi solve (`physicalPrincipalAxes`) preserves relative
 * precision across SI scales. Refuse nonfinite aggregates and nonpositive
 * computed principal moments; finite component admission does not promise
 * arbitrary-precision arithmetic.
 *
 * @param parts Rigid parts in one common frame, with positive finite SI masses
 *   and principal moments, finite centres and unit principal rotations within
 *   1e-6 of unit length.
 * @returns Fresh aggregate mass properties in that same frame; moments are
 *   ascending.
 * @throws {Error} When parts are empty or invalid, or aggregate arithmetic
 *   produces nonfinite or nonpositive principal properties.
 */
export function combinePhysicalMassProperties(
  parts: readonly IAutoMovieCombinePhysicalMassProperties.IPart[],
): IAutoMovieCombinePhysicalMassProperties.IPart {
  if (!parts.length)
    throw new Error("Mass properties require at least one component");
  for (const part of parts) {
    if (
      part.mass <= 0 ||
      !positiveMoments(part.inertia) ||
      Math.abs(
        Math.hypot(
          part.inertiaRotation.x,
          part.inertiaRotation.y,
          part.inertiaRotation.z,
          part.inertiaRotation.w,
        ) - 1,
      ) > 1e-6
    )
      throw new Error("Invalid component mass properties");
  }
  let mass: number = 0;
  for (const part of parts) mass += part.mass;

  // Normalize positive weights before multiplying positions: a finite mean
  // need not have a representable unnormalized mass-times-position numerator.
  let x: number = 0;
  let y: number = 0;
  let z: number = 0;
  for (const part of parts) {
    const weight: number = part.mass / mass;
    x += part.centerOfMass.x * weight;
    y += part.centerOfMass.y * weight;
    z += part.centerOfMass.z * weight;
  }
  const centerOfMass: IAutoMovieVector3 = { x, y, z };
  const tensor: number[][] = physicalInertiaTensor(parts, centerOfMass);
  const axes3: IAutoMoviePrincipalTensorFrame = physicalPrincipalAxes(tensor);
  const inertia: IAutoMovieVector3 = axes3.moments;
  const inertiaRotation: IAutoMovieQuaternion = axes3.rotation;
  if (!positiveMoments(inertia))
    throw new Error("Invalid computed aggregate principal frame");
  return { mass, centerOfMass, inertia, inertiaRotation };
}

/** Whether each principal moment is positive. */
function positiveMoments(value: IAutoMovieVector3): boolean {
  return value.x > 0 && value.y > 0 && value.z > 0;
}
