import { TestValidator } from "@nestia/e2e";

import { createRecoveryMapTangent } from "../../../../packages/recovery/src/internal/createRecoveryMapTangent";
import { differentiateRecoveryMapProjection } from "../../../../packages/recovery/src/internal/differentiateRecoveryMapProjection";
import { differentiateRecoveryMapTangent } from "../../../../packages/recovery/src/internal/differentiateRecoveryMapTangent";
import { linearizeRecoveryFeasibleMap } from "../../../../packages/recovery/src/internal/linearizeRecoveryFeasibleMap";
import { stepRecoveryMapSeedPose } from "../../../../packages/recovery/src/internal/stepRecoveryMapSeedPose";
import { stepRecoveryRelativePose } from "../../../../packages/recovery/src/internal/stepRecoveryRelativePose";
import type { IAutoMovieRecoveryMapPose } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoveryMapState } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryMapState";
import { createRecoveryMapNumericalFixture } from "../internal/createRecoveryMapNumericalFixture";
import { nclose } from "../internal/nclose";

/**
 * Current-radius map updates and physical derivatives share the original base.
 *
 * Scenarios:
 * 1. Unit and both adjacent admitted radii preserve their current zero value and radius, while a finite coefficient step follows the independent r*N formula.
 * 2. Axis and non-axis raw charts have actual P_t B differentials; the latter distinguishes an admitted radial component from an exactly tangent assumption.
 * 3. Scalar pinhole formulas independently determine weighted objective rows, original disk rows and local first/second derivatives on the same chart.
 * 4. Relative Sampson's normalized updater remains distinct; malformed charts and unsupported arithmetic preserve their error/null boundaries and borrowed inputs.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual map updater, raw construction, differential, physical linearizer and local curvature over resident analytic arrays. It detects a normalized zero jump, wrong radius, raw-B substitution, missing normalization factors and mismatched objective/disk/curvature coordinates.
 * @evidence contracts/testing.md#independent-expectations G=r*N(t+Bz), T=B-t*(t dot B)/r^2 and the displayed normalization chain rule give scalar expectations. Authored axis and least-axis non-axis formulas specify B independently; scalar quotient differentiation supplies pinhole rows and Hessians, without fitted geometry or finite differences as an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Covers r=1 and r=1+-4e-11, axis/non-axis, both seed coefficients, zero and finite steps, rotation-only zero translation, original robust/unweighted units, malformed and zero/underflow/null cases and immutable inputs. Separate producer and existing joint entries own rank, convergence, routing and cumulative admission.
 * @evidence contracts/testing.md#execution-ownership Portable test_recovery_map_seed_chart calls maintained source with authored resident arrays only; no photo, process, filesystem, compiler, installation, GPU, foreign override or full-scene fit starts.
 */
export function test_recovery_map_seed_chart(): void {
  const identity: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const fixture: ReturnType<typeof createRecoveryMapNumericalFixture> =
    createRecoveryMapNumericalFixture();
  let distinguished: number = 0;
  for (const radius of [1 - 4e-11, 1, 1 + 4e-11]) {
    const pose: IAutoMovieRecoveryMapPose = {
      rotation: [...identity],
      translation: [0, 0, radius],
    };
    const basis: [number, number, number][] = [
      [1, 0, 0],
      [0, radius, 0],
    ];
    const before: string = JSON.stringify({ pose, basis });
    const zero: IAutoMovieRecoveryMapPose = stepRecoveryMapSeedPose(
      pose,
      basis,
      [0, 0, 0, 0, 0],
    );
    const rotationOnly: IAutoMovieRecoveryMapPose = stepRecoveryMapSeedPose(
      pose,
      basis,
      [0.01, -0.02, 0.03, 0, 0],
    );
    const increment: number[] = [0, 0, 0, 0.02, -0.03];
    const actual: IAutoMovieRecoveryMapPose = stepRecoveryMapSeedPose(
      pose,
      basis,
      increment,
    );
    const denominator: number = Math.sqrt(
      0.02 ** 2 + radius ** 2 * (1 + 0.03 ** 2),
    );
    const expected: number[] = [
      (radius * 0.02) / denominator,
      (-(radius ** 2) * 0.03) / denominator,
      radius ** 2 / denominator,
    ];
    const relative: ReturnType<typeof stepRecoveryRelativePose> =
      stepRecoveryRelativePose(pose, basis, [0, 0, 0, 0, 0]);
    TestValidator.predicate(
      `independent current value and radius at ${radius}`,
      zero.translation.every((value: number, axis: number): boolean =>
        nclose(value, pose.translation[axis]!, 0),
      ) &&
        rotationOnly.translation.every((value: number, axis: number): boolean =>
          nclose(value, pose.translation[axis]!, 0),
        ) &&
        actual.translation.every((value: number, axis: number): boolean =>
          nclose(value, expected[axis]!, 2e-15),
        ) &&
        nclose(Math.hypot(...actual.translation), radius, 2e-15) &&
        nclose(relative.translation[2], 1, 0) &&
        increment.join(",") === "0,0,0,0.02,-0.03" &&
        JSON.stringify({ pose, basis }) === before,
    );
    const tangent: ReturnType<typeof differentiateRecoveryMapTangent> =
      differentiateRecoveryMapTangent(pose.translation, basis);
    const local: ReturnType<typeof differentiateRecoveryMapProjection> =
      differentiateRecoveryMapProjection(pose, [1, 0, 1], identity, basis);
    TestValidator.predicate(
      `independent axis pinhole first and second derivatives at ${radius}`,
      tangent !== null &&
        local !== null &&
        nclose(tangent[0]![0], 1, 1e-15) &&
        nclose(tangent[1]![1], radius, 1e-15) &&
        nclose(local.pixel[0], 1 / (1 + radius), 1e-15) &&
        nclose(local.jacobian[0]![3]!, 1 / (1 + radius), 1e-15) &&
        nclose(local.jacobian[1]![4]!, radius / (1 + radius), 1e-15) &&
        nclose(
          local.hessians[0]![3]![3]!,
          1 / (radius * (1 + radius) ** 2),
          1e-14,
        ) &&
        nclose(local.hessians[0]![4]![4]!, radius / (1 + radius) ** 2, 1e-14),
    );
    const nonaxis: IAutoMovieRecoveryMapPose = {
      rotation: [...identity],
      translation: [0.36 * radius, 0.48 * radius, 0.8 * radius],
    };
    const h: number = Math.sqrt(1 + 0.1296 * radius ** 2 * (radius ** 2 - 2));
    const prescribed: [number, number, number][] = [
      [
        (1 - 0.1296 * radius ** 2) / h,
        (-0.1728 * radius ** 2) / h,
        (-0.288 * radius ** 2) / h,
      ],
      [0, (0.8 * radius) / h, (-0.48 * radius) / h],
    ];
    const raw: ReturnType<typeof createRecoveryMapTangent> =
      createRecoveryMapTangent(nonaxis.translation);
    const nonaxisZero: IAutoMovieRecoveryMapPose = stepRecoveryMapSeedPose(
      nonaxis,
      raw,
      [0, 0, 0, 0, 0],
    );
    const nonaxisTrial: IAutoMovieRecoveryMapPose = stepRecoveryMapSeedPose(
      nonaxis,
      raw,
      increment,
    );
    const rawDirection: number[] = nonaxis.translation.map(
      (value: number, axis: number): number =>
        value + 0.02 * prescribed[0]![axis]! - 0.03 * prescribed[1]![axis]!,
    );
    const rawLength: number = Math.hypot(...rawDirection);
    TestValidator.predicate(
      `non-axis current value and finite-step chart at ${radius}`,
      nonaxisZero.translation.every((value: number, axis: number): boolean =>
        nclose(value, nonaxis.translation[axis]!, 0),
      ) &&
        nonaxisTrial.translation.every((value: number, axis: number): boolean =>
          nclose(value, (radius * rawDirection[axis]!) / rawLength, 3e-15),
        ),
    );
    const derivative: ReturnType<typeof differentiateRecoveryMapTangent> =
      differentiateRecoveryMapTangent(nonaxis.translation, raw);
    const products: number[] = prescribed.map(
      (row: readonly number[]): number =>
        row[0]! * nonaxis.translation[0] +
        row[1]! * nonaxis.translation[1] +
        row[2]! * nonaxis.translation[2],
    );
    const expectedFirst: number[][] = prescribed.map(
      (row: readonly number[], column: number): number[] =>
        row.map(
          (value: number, axis: number): number =>
            value -
            (nonaxis.translation[axis]! * products[column]!) / radius ** 2,
        ),
    );
    TestValidator.predicate(
      `non-axis raw coefficients and actual projected differential at ${radius}`,
      derivative !== null &&
        raw.every((row: readonly number[], column: number): boolean =>
          row.every((value: number, axis: number): boolean =>
            nclose(value, prescribed[column]![axis]!, 2e-15),
          ),
        ) &&
        derivative.every((row: readonly number[], column: number): boolean =>
          row.every((value: number, axis: number): boolean =>
            nclose(value, expectedFirst[column]![axis]!, 3e-15),
          ),
        ),
    );
    if (
      radius !== 1 &&
      Math.abs(expectedFirst[0]![0]! - prescribed[0]![0]!) > 1e-12
    )
      distinguished++;
    const point: [number, number, number] = [0.4, -0.2, 2];
    const q: number[] = point.map(
      (value: number, axis: number): number =>
        value + nonaxis.translation[axis]!,
    );
    const pixels: [number, number] = [q[0]! / q[2]!, q[1]! / q[2]!];
    const state: IAutoMovieRecoveryMapState = {
      poses: [{ rotation: [...identity], translation: [0, 0, 0] }, nonaxis],
      landmarks: [
        {
          id: 0,
          point,
          observations: [
            {
              viewIndex: 1,
              featureIndex: 0,
              pixel: [pixels[0] - 0.2, pixels[1] + 0.1],
            },
          ],
        },
      ],
    };
    const model: ReturnType<typeof linearizeRecoveryFeasibleMap> =
      linearizeRecoveryFeasibleMap(
        state,
        [identity, identity],
        fixture.input.policy,
      );
    const residual: number[] = [0.2, -0.1];
    const robust: number = Math.hypot(
      1,
      Math.hypot(...residual) / fixture.input.policy.lossScalePx,
    );
    const jet: ReturnType<typeof differentiateRecoveryMapProjection> =
      differentiateRecoveryMapProjection(nonaxis, point, identity, raw);
    for (let column: number = 0; column < 2; column++) {
      const first: number[] = [0, 1].map(
        (axis: number): number =>
          (expectedFirst[column]![axis]! -
            pixels[axis]! * expectedFirst[column]![2]!) /
          q[2]!,
      );
      const gradient: number =
        (residual[0]! * first[0]! + residual[1]! * first[1]!) / robust;
      const disk: number =
        (2 * (residual[0]! * first[0]! + residual[1]! * first[1]!)) /
        fixture.input.policy.maximumReprojectionErrorPx ** 2;
      TestValidator.predicate(
        `same-chart robust and original disk rows at ${radius}/${column}`,
        nclose(model.rows[0]!.values[3 + column]!, gradient, 2e-15) &&
          nclose(model.rows[1]!.values[3 + column]!, disk, 2e-15) &&
          first.every((value: number, axis: number): boolean =>
            nclose(
              model.blocks[0]!.cameraRows[axis]![3 + column]!,
              value / Math.sqrt(robust),
              2e-15,
            ),
          ) &&
          jet !== null &&
          first.every((value: number, axis: number): boolean =>
            nclose(jet.jacobian[axis]![3 + column]!, value, 3e-15),
          ),
      );
      for (let other: number = 0; other < 2; other++) {
        const dot: number = prescribed[column]!.reduce(
          (sum: number, value: number, axis: number): number =>
            sum + value * prescribed[other]![axis]!,
          0,
        );
        const second: number[] = [0, 1, 2].map(
          (axis: number): number =>
            -(
              prescribed[column]![axis]! * products[other]! +
              prescribed[other]![axis]! * products[column]! +
              nonaxis.translation[axis]! * dot
            ) /
              radius ** 2 +
            (3 *
              nonaxis.translation[axis]! *
              products[column]! *
              products[other]!) /
              radius ** 4,
        );
        TestValidator.predicate(
          `independent non-axis quotient Hessian at ${radius}/${column}/${other}`,
          jet !== null &&
            [0, 1].every((axis: number): boolean => {
              const firstOther: number =
                (expectedFirst[other]![axis]! -
                  pixels[axis]! * expectedFirst[other]![2]!) /
                q[2]!;
              const expectedSecond: number =
                (second[axis]! -
                  pixels[axis]! * second[2]! -
                  first[axis]! * expectedFirst[other]![2]! -
                  firstOther * expectedFirst[column]![2]!) /
                q[2]!;
              return nclose(
                jet.hessians[axis]![3 + column]![3 + other]!,
                expectedSecond,
                1e-14,
              );
            }),
        );
      }
    }
  }
  TestValidator.predicate(
    "both adjacent non-axis cases require projected first rows",
    distinguished === 2,
  );
  let malformed: unknown = null;
  try {
    differentiateRecoveryMapTangent([0, 0, 1], [[1, 0, 0]]);
  } catch (error: unknown) {
    malformed = error;
  }
  let nonunit: unknown = null;
  try {
    stepRecoveryMapSeedPose(
      { rotation: [...identity], translation: [0, 0, 1.01] },
      [
        [1, 0, 0],
        [0, 1, 0],
      ],
      [0, 0, 0, 0, 0],
    );
  } catch (error: unknown) {
    nonunit = error;
  }
  let hole: unknown = null;
  try {
    differentiateRecoveryMapTangent(
      [0, 0, 1],
      new Array<[number, number, number]>(2),
    );
  } catch (error: unknown) {
    hole = error;
  }
  TestValidator.predicate(
    "malformed ownership and unsupported computed arithmetic remain distinct",
    malformed instanceof Error &&
      nonunit instanceof Error &&
      hole instanceof Error &&
      differentiateRecoveryMapTangent(
        [0, 0, 0],
        [
          [1, 0, 0],
          [0, 1, 0],
        ],
      ) === null &&
      differentiateRecoveryMapTangent(
        [0, 0, 1e-200],
        [
          [1, 0, 0],
          [0, 1, 0],
        ],
      ) === null,
  );
}
