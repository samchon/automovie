import {
  Quaternion,
  Vector3,
  physicalInertiaTensor,
  physicalPrincipalAxes,
} from "@automovie/engine";
import type {
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { qunit } from "../internal/qunit";
import { throwsError } from "../internal/throwsError";

/**
 * Tensor assembly, direct spin and principal reduction retain the same
 * physical rigid part under scalar work reuse and early Jacobi termination.
 *
 * A mass-2 uniform box with side lengths (sqrt(15),3,sqrt(3)) has principal
 * moments (2,3,4). The unit quaternion (1,2,2,2)/sqrt(13) gives the matrix
 * R=[[-3,-4,12],[12,3,4],[-4,12,3]]/13. Multiplication of this declared matrix
 * by diag(2,3,4) gives T=[[642,84,24],[84,379,60],[24,60,500]]/169.
 * About a point displaced by d=(1,-2,3), the parallel-axis term is
 * [[26,4,-6],[4,20,12],[-6,12,10]]. For omega=(2,-3,5), intrinsic spin is
 * (1152,-669,2368)/169. These rational values do not come from the assembly
 * kernel or another numerical diagonalization.
 *
 * Scenarios:
 * 1. All nine dense rotated/shifted tensor entries match those numbers.
 *    Translating both centre and reference point changes none of them.
 * 2. Direct spin reads its supplied rotation, rather than the part's saved
 *    rotation, and matches the explicit dense product or (4,-9,20) at rest.
 *    Later calls and caller mutation of returned rows/vectors stay isolated.
 * 3. Dense and already diagonal tensors yield sorted moments (2,3,4).
 *    Returned principal axes satisfy T v=lambda v without assuming a sign
 *    for an eigenvector; a zero tensor is refused by its public contract.
 * 4. Nonfinite centre data continue to produce nonfinite tensor/spin, even
 *    for zero velocity, so eliminating an allocation cannot hide bad input.
 *
 * Tensor/spin absolute rounding remains 1e-12, as the existing closed-form
 * mass test; principal residuals retain its 1e-9 covariance bound. This
 * deferred regression complements the representative isotropic ring, whose
 * diagonal tensor cannot independently distinguish an off-diagonal defect.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Derives the physical box, rational rotation/tensor/spin, parallel-axis term, eigenvector sign freedom and existing numerical bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public assembly, direct spin and principal reduction, reads all tensor entries and actual eigenvectors, and probes current input and returned-data isolation plus invalid-data propagation.
 * @evidence contracts/development/testing.md#independent-expectations Uniform-box moments, the explicit rational orthogonal matrix, its hand-multiplied tensor and spin, the parallel-axis theorem and T v=lambda v give expectations without the production component kernel or a second eigensolver.
 * @evidence contracts/development/testing.md#distinguishing-cases Nonzero off-diagonals in all planes, an offset with mixed signs, explicit versus saved rotation, changed calls and owned outputs, dense versus no-rotation Jacobi, eigenvector sign freedom, zero tensor refusal and nonfinite zero-speed propagation distinguish the optimized paths.
 * @evidence contracts/development/testing.md#execution-ownership One deferred CPU unit owns one physical part and small numeric matrices, mutates only its own records and starts no process, renderer or foreign method replacement.
 */
export function test_engine_mass_tensor_spin(): void {
  const findings: string[] = [];
  const norm: number = Math.sqrt(13);
  const rotation: IAutoMovieQuaternion = {
    x: 1 / norm,
    y: 2 / norm,
    z: 2 / norm,
    w: 2 / norm,
  };
  const about: IAutoMovieVector3 = { x: 4, y: 5, z: -6 };
  const part: IAutoMovieCombinePhysicalMassProperties.IPart = {
    mass: 2,
    centerOfMass: { x: 5, y: 3, z: -3 },
    inertia: { x: 2, y: 3, z: 4 },
    inertiaRotation: rotation,
  };
  const intrinsic: readonly (readonly number[])[] = [
    [642 / 169, 84 / 169, 24 / 169],
    [84 / 169, 379 / 169, 60 / 169],
    [24 / 169, 60 / 169, 500 / 169],
  ];
  const expected: readonly (readonly number[])[] = [
    [642 / 169 + 26, 84 / 169 + 4, 24 / 169 - 6],
    [84 / 169 + 4, 379 / 169 + 20, 60 / 169 + 12],
    [24 / 169 - 6, 60 / 169 + 12, 500 / 169 + 10],
  ];
  const checkTensor: (
    label: string,
    actual: readonly (readonly number[])[],
  ) => void = (label: string, actual: readonly (readonly number[])[]): void => {
    if (
      actual.length !== 3 ||
      actual.some((row: readonly number[]): boolean => row.length !== 3)
    ) {
      findings.push(`${label}: tensor is not three by three`);
      return;
    }
    for (let i: number = 0; i < 3; i++)
      for (let j: number = 0; j < 3; j++)
        if (!nclose(actual[i]![j]!, expected[i]![j]!, 1e-12))
          findings.push(
            `${label}: tensor ${i},${j} is ${actual[i]![j]}, expected ${expected[i]![j]}`,
          );
  };
  const first: number[][] = physicalInertiaTensor([part], about);
  checkTensor("dense shifted box", first);
  if (first[0] === first[1] || first[1] === first[2] || first[0] === first[2])
    findings.push("tensor rows share mutable storage");
  const shifted: IAutoMovieCombinePhysicalMassProperties.IPart = {
    ...part,
    centerOfMass: { x: 12, y: -8, z: 2 },
  };
  checkTensor(
    "rigid translation",
    physicalInertiaTensor([shifted], { x: 11, y: -6, z: -1 }),
  );
  first[0]![1] = NaN;
  if (!nclose(first[1]![0]!, expected[1]![0]!, 1e-12))
    findings.push("editing one owned tensor row changed another");
  checkTensor(
    "after returned tensor mutation",
    physicalInertiaTensor([part], about),
  );

  part.inertiaRotation = Quaternion.identity();
  const velocity: IAutoMovieVector3 = { x: 2, y: -3, z: 5 };
  const spin: IAutoMovieVector3 = physicalInertiaTensor.spin(
    part,
    rotation,
    velocity,
  );
  const checkSpin: (label: string, actual: IAutoMovieVector3) => void = (
    label: string,
    actual: IAutoMovieVector3,
  ): void => {
    if (
      !(
        nclose(actual.x, 1152 / 169, 1e-12) &&
        nclose(actual.y, -669 / 169, 1e-12) &&
        nclose(actual.z, 2368 / 169, 1e-12)
      )
    )
      findings.push(`${label}: spin is ${JSON.stringify(actual)}`);
  };
  checkSpin("supplied dense principal rotation", spin);
  const straight: IAutoMovieVector3 = physicalInertiaTensor.spin(
    part,
    Quaternion.identity(),
    velocity,
  );
  if (
    !(
      nclose(straight.x, 4, 1e-12) &&
      nclose(straight.y, -9, 1e-12) &&
      nclose(straight.z, 20, 1e-12)
    )
  )
    findings.push("rest-frame spin does not equal diag(2,3,4) omega");
  checkSpin("a later call preserves earlier spin", spin);
  spin.x = NaN;
  spin.y = Infinity;
  spin.z = -Infinity;
  checkSpin(
    "after returned spin mutation",
    physicalInertiaTensor.spin(part, rotation, velocity),
  );

  for (const dense of [true, false]) {
    const tensor: number[][] = dense
      ? intrinsic.map((row: readonly number[]): number[] => [...row])
      : [
          [4, 0, 0],
          [0, 2, 0],
          [0, 0, 3],
        ];
    const principal: ReturnType<typeof physicalPrincipalAxes> =
      physicalPrincipalAxes(tensor);
    const moments: readonly number[] = [
      principal.moments.x,
      principal.moments.y,
      principal.moments.z,
    ];
    if (
      !(
        moments.every((value: number, i: number): boolean =>
          nclose(value, i + 2, 1e-12),
        ) && qunit(principal.rotation)
      )
    )
      findings.push(
        `${dense ? "dense" : "diagonal"} principal moments or frame are invalid`,
      );
    const basis: readonly IAutoMovieVector3[] = [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 },
    ];
    for (let i: number = 0; i < 3; i++) {
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(
        principal.rotation,
        basis[i]!,
      );
      const applied: IAutoMovieVector3 = dense
        ? {
            x: (642 * axis.x + 84 * axis.y + 24 * axis.z) / 169,
            y: (84 * axis.x + 379 * axis.y + 60 * axis.z) / 169,
            z: (24 * axis.x + 60 * axis.y + 500 * axis.z) / 169,
          }
        : { x: 4 * axis.x, y: 2 * axis.y, z: 3 * axis.z };
      if (
        !(
          Vector3.length(
            Vector3.subtract(applied, Vector3.scale(axis, i + 2)),
          ) <= 1e-9
        )
      )
        findings.push(
          `${dense ? "dense" : "diagonal"} principal axis ${i} violates its independent eigenvector equation`,
        );
    }
  }
  TestValidator.predicate(
    "zero tensor cannot define principal axes",
    throwsError((): void => {
      physicalPrincipalAxes([
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);
    }),
  );

  TestValidator.equals(
    "dense tensor, direct spin and principal reduction retain physical values",
    findings,
    [],
  );
}
