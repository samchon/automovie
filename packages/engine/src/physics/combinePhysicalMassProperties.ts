import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { quaternionFromAutoMovieBasis } from "../math/quaternionFromAutoMovieBasis";

/**
 * Combine rotated inertia tensors using the parallel-axis theorem. A
 * dimensionless Jacobi solve preserves relative precision across SI scales.
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
  parts: readonly combinePhysicalMassProperties.IPart[],
): combinePhysicalMassProperties.IPart {
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
    (sum: number, part: combinePhysicalMassProperties.IPart): number =>
      sum + part.mass,
    0,
  );
  if (!Number.isFinite(mass))
    throw new Error("Aggregate mass exceeds finite arithmetic");

  // Normalize positive weights before multiplying positions: a finite mean
  // need not have a representable unnormalized mass-times-position numerator.
  const centerOfMass: IAutoMovieVector3 = parts.reduce(
    (
      sum: IAutoMovieVector3,
      part: combinePhysicalMassProperties.IPart,
    ): IAutoMovieVector3 =>
      Vector3.add(sum, Vector3.scale(part.centerOfMass, part.mass / mass)),
    { x: 0, y: 0, z: 0 },
  );
  if (![centerOfMass.x, centerOfMass.y, centerOfMass.z].every(Number.isFinite))
    throw new Error("Aggregate centre exceeds finite arithmetic");
  const basis: IAutoMovieVector3[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ];
  const axes: ("x" | "y" | "z")[] = ["x", "y", "z"];
  const tensor: number[][] = Array.from({ length: 3 }, (): number[] => [
    0, 0, 0,
  ]);
  for (const part of parts) {
    const rotated: IAutoMovieVector3[] = basis.map(
      (axis: (typeof basis)[number]): IAutoMovieVector3 =>
        Quaternion.rotateVector(part.inertiaRotation, axis),
    );
    const displacement: IAutoMovieVector3 = Vector3.subtract(
      part.centerOfMass,
      centerOfMass,
    );
    for (let row: number = 0; row < 3; row++)
      for (let column: number = 0; column < 3; column++) {
        tensor[row]![column]! +=
          rotated.reduce(
            (
              sum: number,
              direction: IAutoMovieVector3,
              index: number,
            ): number =>
              sum +
              part.inertia[axes[index]!] *
                direction[axes[row]!] *
                direction[axes[column]!],
            0,
          ) +
          part.mass *
            ((row === column ? Vector3.dot(displacement, displacement) : 0) -
              displacement[axes[row]!] * displacement[axes[column]!]);
      }
  }
  if (!tensor.flat().every(Number.isFinite))
    throw new Error("Aggregate inertia tensor exceeds finite arithmetic");

  // Jacobi's stopping criterion must compare dimensionless entries rather
  // than mixing a fixed unit-one floor with moments measured in kg m².
  const scale: number = Math.max(
    ...tensor.flat().map((value: number): number => Math.abs(value)),
  );
  if (!(scale > 0)) throw new Error("Invalid aggregate inertia tensor");
  for (const row of tensor)
    for (let column: number = 0; column < 3; column++) row[column]! /= scale;
  const vectors: number[][] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  // Symmetric Jacobi diagonalization, fixed pair order and bounded work.
  for (let sweep: number = 0; sweep < 32; sweep++)
    for (const [p, q] of [
      [0, 1],
      [0, 2],
      [1, 2],
    ] as const) {
      const off: number = tensor[p]![q]!;
      if (
        Math.abs(off) <=
        Number.EPSILON *
          Math.max(Math.abs(tensor[p]![p]!), Math.abs(tensor[q]![q]!))
      )
        continue;
      const angle: number =
        0.5 * Math.atan2(2 * off, tensor[q]![q]! - tensor[p]![p]!);
      const c: number = Math.cos(angle);
      const s: number = Math.sin(angle);
      const pp: number = tensor[p]![p]!;
      const qq: number = tensor[q]![q]!;
      tensor[p]![p] = c * c * pp - 2 * s * c * off + s * s * qq;
      tensor[q]![q] = s * s * pp + 2 * s * c * off + c * c * qq;
      tensor[p]![q] = 0;
      tensor[q]![p] = 0;
      for (let k: number = 0; k < 3; k++) {
        if (k !== p && k !== q) {
          const kp: number = tensor[k]![p]!;
          const kq: number = tensor[k]![q]!;
          tensor[k]![p] = c * kp - s * kq;
          tensor[p]![k] = tensor[k]![p]!;
          tensor[k]![q] = s * kp + c * kq;
          tensor[q]![k] = tensor[k]![q]!;
        }
        const vp: number = vectors[k]![p]!;
        const vq: number = vectors[k]![q]!;
        vectors[k]![p] = c * vp - s * vq;
        vectors[k]![q] = s * vp + c * vq;
      }
    }
  const order: number[] = [0, 1, 2].sort(
    (a: number, b: number): number => tensor[a]![a]! - tensor[b]![b]!,
  );
  const principal: IAutoMovieVector3[] = order.map(
    (index: number): IAutoMovieVector3 => ({
      x: vectors[0]![index]!,
      y: vectors[1]![index]!,
      z: vectors[2]![index]!,
    }),
  );
  if (
    Vector3.dot(Vector3.cross(principal[0]!, principal[1]!), principal[2]!) < 0
  )
    principal[2] = Vector3.scale(principal[2]!, -1);
  const inertia: IAutoMovieVector3 = {
    x: tensor[order[0]!]![order[0]!]! * scale,
    y: tensor[order[1]!]![order[1]!]! * scale,
    z: tensor[order[2]!]![order[2]!]! * scale,
  };
  const inertiaRotation: IAutoMovieQuaternion = quaternionFromAutoMovieBasis(
    principal[0]!,
    principal[1]!,
    principal[2]!,
  );
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

/**
 * A component's principal frame and centre use the aggregate's local frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A component's principal frame and centre use the aggregate's local frame) and documents 1 documented member as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents A component's principal frame and centre use the aggregate's local frame: companion namespace of 1 member (`IPart`); units and frames named in its text: kilograms, metres, frame. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `combinePhysicalMassProperties` in packages/engine/src/physics/combinePhysicalMassProperties.ts; its surface is the 1 member listed and the text shows 4 other files naming it, mostly packages/engine (2), packages/human (1), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace combinePhysicalMassProperties {
  /** SI mass, centre and principal inertia; no collision dimensions inferred. */
  export interface IPart {
    /** Kilograms. */ mass: number;
    /** Metres in the common frame. */ centerOfMass: IAutoMovieVector3;
    /** Principal moments, kg m². */ inertia: IAutoMovieVector3;
    /** Principal axes in the common frame. */ inertiaRotation: IAutoMovieQuaternion;
  }
}
