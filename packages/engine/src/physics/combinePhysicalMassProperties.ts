import type {
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMoviePrincipalTensorFrame,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { physicalInertiaTensor } from "./physicalInertiaTensor";
import { physicalPrincipalAxes } from "./physicalPrincipalAxes";

/**
 * Combine rotated inertia tensors using the parallel-axis theorem. A
 * dimensionless Jacobi solve (`physicalPrincipalAxes`) preserves relative
 * precision across SI scales.
 * Refuse nonfinite aggregates and nonpositive computed principal moments;
 * finite component admission does not promise arbitrary-precision arithmetic.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Combine rotated inertia tensors using the parallel-axis theorem) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Combine rotated inertia tensors using the parallel-axis theorem) directly over its typed inputs (`parts`) as nested iteration of depth 4 (for-of over parts; every over [part.centerOfMass.x, part.centerOfMass.; every over [part.inertia.x, part.inertia.y, part.in) plus a sort, delegating to `Number.isFinite`, `Math.abs`, `Math.hypot`, `parts.reduce`, `Vector3.add`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (7 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 0.000001, 3, 32, 0.5, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 181 lines and 23 top-level statements that reuses `Number.isFinite`, `Math.abs`, `Math.hypot`, `parts.reduce`, `Vector3.add` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 73 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `parts`; the dominant cost is nested iteration of depth 4 (for-of over parts; every over [part.centerOfMass.x, part.centerOfMass.; every over [part.inertia.x, part.inertia.y, part.in) plus a sort, performed once per call with 33 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 33 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function combinePhysicalMassProperties(
  parts: readonly IAutoMovieCombinePhysicalMassProperties.IPart[],
): IAutoMovieCombinePhysicalMassProperties.IPart {
  if (!parts.length)
    throw new Error("Mass properties require at least one component");
  for (const part of parts) {
    if (
      !(part.mass > 0) ||
      !Number.isFinite(part.mass) ||
      ![part.centerOfMass.x, part.centerOfMass.y, part.centerOfMass.z].every(
        Number.isFinite,
      ) ||
      ![part.inertia.x, part.inertia.y, part.inertia.z].every(
        (value: number): boolean => Number.isFinite(value) && value > 0,
      ) ||
      ![
        part.inertiaRotation.x,
        part.inertiaRotation.y,
        part.inertiaRotation.z,
        part.inertiaRotation.w,
      ].every(Number.isFinite) ||
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
  const mass: number = parts.reduce(
    (
      sum: number,
      part: IAutoMovieCombinePhysicalMassProperties.IPart,
    ): number => sum + part.mass,
    0,
  );
  if (!Number.isFinite(mass))
    throw new Error("Aggregate mass exceeds finite arithmetic");

  // Normalize positive weights before multiplying positions: a finite mean
  // need not have a representable unnormalized mass-times-position numerator.
  const centerOfMass: IAutoMovieVector3 = parts.reduce(
    (
      sum: IAutoMovieVector3,
      part: IAutoMovieCombinePhysicalMassProperties.IPart,
    ): IAutoMovieVector3 =>
      Vector3.add(sum, Vector3.scale(part.centerOfMass, part.mass / mass)),
    { x: 0, y: 0, z: 0 },
  );
  if (![centerOfMass.x, centerOfMass.y, centerOfMass.z].every(Number.isFinite))
    throw new Error("Aggregate centre exceeds finite arithmetic");
  const tensor: number[][] = physicalInertiaTensor(parts, centerOfMass);
  if (!tensor.flat().every(Number.isFinite))
    throw new Error("Aggregate inertia tensor exceeds finite arithmetic");

  const axes3: IAutoMoviePrincipalTensorFrame = physicalPrincipalAxes(tensor);
  const inertia: IAutoMovieVector3 = axes3.moments;
  const inertiaRotation: IAutoMovieQuaternion = axes3.rotation;
  if (
    ![inertia.x, inertia.y, inertia.z].every(
      (value: number): boolean => Number.isFinite(value) && value > 0,
    ) ||
    ![
      inertiaRotation.x,
      inertiaRotation.y,
      inertiaRotation.z,
      inertiaRotation.w,
    ].every(Number.isFinite)
  )
    throw new Error("Invalid computed aggregate principal frame");
  return { mass, centerOfMass, inertia, inertiaRotation };
}
