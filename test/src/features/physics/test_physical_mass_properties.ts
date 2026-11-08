import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { combinePhysicalMassProperties as combine } from "../../../../packages/engine/src/physics/combinePhysicalMassProperties";

/** Analytic tensor expectations independent of the diagonalizer.
 *
 * Scenarios:
 * 1. Two equal displaced spheres conserve mass and centre.
 * 2. Their transverse principal moments include the parallel-axis term.
 * 3. Single-axis and compound-axis anisotropic tensors retain all independently known entries at scales 1e-20, 1 and 1e20.
 * 4. Every nonfinite principal-frame component refuses before tensor arithmetic.
 * 5. A finite huge weighted centre does not overflow its mass-times-position numerator.
 * 6. Nonfinite aggregate mass, tensor and principal moments refuse even when each component is finite.
 */
export function test_physical_mass_properties(): void {
  const pair: combine.IPart = combine(
    [-1, 1].map(
      (x: number): combine.IPart => ({
        mass: 2,
        centerOfMass: { x, y: 0, z: 0 },
        inertia: { x: 0.2, y: 0.2, z: 0.2 },
        inertiaRotation: { x: 0, y: 0, z: 0, w: 1 },
      }),
    ),
  );
  TestValidator.predicate(
    "mass centre and parallel axis",
    pair.mass === 4 &&
      Math.hypot(
        pair.centerOfMass.x,
        pair.centerOfMass.y,
        pair.centerOfMass.z,
      ) < 1e-12 &&
      Math.abs(pair.inertia.x - 0.4) < 1e-12 &&
      Math.abs(pair.inertia.y - 4.4) < 1e-12 &&
      Math.abs(pair.inertia.z - 4.4) < 1e-12,
  );
  const base: combine.IPart = {
    mass: 1,
    centerOfMass: { x: 0, y: 0, z: 0 },
    inertia: { x: 1, y: 2, z: 3 },
    inertiaRotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const h: number = Math.SQRT1_2;
  const rotations: {
    name: string;
    quaternion: combine.IPart["inertiaRotation"];
    tensor: number[][];
  }[] = [
    {
      name: "z45",
      quaternion: {
        x: 0,
        y: 0,
        z: Math.sin(Math.PI / 8),
        w: Math.cos(Math.PI / 8),
      },
      tensor: [
        [1.5, -0.5, 0],
        [-0.5, 1.5, 0],
        [0, 0, 3],
      ],
    },

    // Rz(45deg)Rx(45deg) has columns (h,h,0),(-.5,.5,h),(.5,-.5,h).
    {
      name: "z45-x45",
      quaternion: { x: h / 2, y: (1 - h) / 2, z: h / 2, w: (1 + h) / 2 },
      tensor: [
        [1.75, -0.75, h / 2],
        [-0.75, 1.75, -h / 2],
        [h / 2, -h / 2, 2.5],
      ],
    },
  ];
  const coordinates: ("x" | "y" | "z")[] = ["x", "y", "z"];
  for (const rotation of rotations)
    for (const scale of [1e-20, 1, 1e20]) {
      const rotated: combine.IPart = combine([
        {
          ...base,
          inertia: { x: scale, y: 2 * scale, z: 3 * scale },
          inertiaRotation: rotation.quaternion,
        },
      ]);
      const axes: IAutoMovieVector3[] = [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
      ].map(
        (axis: IAutoMovieVector3): IAutoMovieVector3 =>
          Quaternion.rotateVector(rotated.inertiaRotation, axis),
      );
      const moments: number[] = [
        rotated.inertia.x,
        rotated.inertia.y,
        rotated.inertia.z,
      ];
      for (let row: number = 0; row < 3; row++)
        for (let column: number = 0; column < 3; column++) {
          const actual: number = axes.reduce(
            (sum: number, axis: IAutoMovieVector3, index: number): number =>
              sum +
              moments[index]! *
                axis[coordinates[row]!] *
                axis[coordinates[column]!],
            0,
          );
          TestValidator.predicate(
            `${rotation.name}/${scale} tensor[${row},${column}]`,
            Math.abs(actual / scale - rotation.tensor[row]![column]!) < 1e-12,
          );
        }
    }

  const huge: combine.IPart = combine(
    [base, base].map(
      (part: combine.IPart): combine.IPart => ({
        ...part,
        mass: 1e200,
        centerOfMass: { x: 1e200, y: -1e200, z: 0.5e200 },
      }),
    ),
  );
  TestValidator.predicate(
    "finite weighted centre survives overflowing unnormalized products",
    huge.mass === 2e200 &&
      Math.abs(huge.centerOfMass.x / 1e200 - 1) < 1e-12 &&
      Math.abs(huge.centerOfMass.y / 1e200 + 1) < 1e-12 &&
      Math.abs(huge.centerOfMass.z / 1e200 - 0.5) < 1e-12 &&
      Math.abs(huge.inertia.x - 2) < 1e-12 &&
      Math.abs(huge.inertia.y - 4) < 1e-12 &&
      Math.abs(huge.inertia.z - 6) < 1e-12,
  );

  const overflow: combine.IPart[][] = [
    [base, base].map(
      (part: combine.IPart): combine.IPart => ({
        ...part,
        mass: Number.MAX_VALUE,
      }),
    ),
    [-1, 1].map(
      (sign: number): combine.IPart => ({
        ...base,
        centerOfMass: { x: sign * 1e200, y: 0, z: 0 },
      }),
    ),
    [base, base].map(
      (part: combine.IPart): combine.IPart => ({
        ...part,
        inertia: {
          x: 0.6 * Number.MAX_VALUE,
          y: 0.01 * Number.MAX_VALUE,
          z: 0.01 * Number.MAX_VALUE,
        },
        inertiaRotation: rotations[0]!.quaternion,
      }),
    ),
  ];
  for (const parts of overflow)
    assert.throws((): combine.IPart => combine(parts), /aggregate/i);
  let refusals: number = 0;
  for (const axis of ["x", "y", "z", "w"] as const)
    for (const value of [NaN, Infinity, -Infinity]) {
      const invalid: combine.IPart = structuredClone(base);
      invalid.inertiaRotation[axis] = value;
      try {
        combine([invalid]);
      } catch {
        refusals++;
      }
    }
  TestValidator.equals(
    "all nonfinite principal-frame coordinates refuse",
    refusals,
    12,
  );
}
