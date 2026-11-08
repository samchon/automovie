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

/** A component's principal frame and centre use the aggregate's local frame. */
export namespace combinePhysicalMassProperties {
  /** SI mass, centre and principal inertia; no collision dimensions inferred. */
  export interface IPart {
    /** Kilograms. */ mass: number;
    /** Metres in the common frame. */ centerOfMass: IAutoMovieVector3;
    /** Principal moments, kg m². */ inertia: IAutoMovieVector3;
    /** Principal axes in the common frame. */ inertiaRotation: IAutoMovieQuaternion;
  }
}
