import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieSimplexAtom } from "../../../../packages/engine/src/math/IAutoMovieSimplexAtom";
import type { IAutoMovieRecoveryMapLandmark } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapLandmark";
import { createRecoveryCameraChart } from "../../../../packages/recovery/src/internal/createRecoveryCameraChart";
import { refineRecoveryCameraMap } from "../../../../packages/recovery/src/internal/refineRecoveryCameraMap";
import { solveRecoveryMapJointStep } from "../../../../packages/recovery/src/internal/solveRecoveryMapJointStep";
import { createRecoveryMapNumericalFixture } from "../internal/createRecoveryMapNumericalFixture";
import { nclose } from "../internal/nclose";

/**
 * Feasible directions consume the same scaled arrowhead original-design metric.
 *
 * Scenarios:
 * 1. A nonsymmetric multi-landmark design with positive damping preserves the full original quadratic norm under inverse metric action.
 * 2. Dense and one-point sparse covectors satisfy independent transpose duality with that inverse action, including camera/point column scales and ordering.
 * 3. The actual joint consumer accepts an already exact nonplanar map by normal pixel KKT, preserving first pose, unit seed scale, every observation and a nonunit later baseline.
 * 4. Insufficient direction entries, direction work and total resident entries refuse before numerical materialization, charging only bounded input metadata.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual rank-qualified block factorization with metric retention and the actual opt-in map joint consumer. Independent direct original-design products catch mismatched column scales, point/camera permutation, wrong triangular transpose or dropped damping.
 * @evidence contracts/testing.md#independent-expectations Direct authored Jacobian rows and global column norms give ||J*physicalStep||^2+lambda*||scaledStep||^2=||metricStep||^2. Direct covector dot physicalStep must equal whitened covector dot metricStep. Exact scalar-projected fixture geometry supplies the zero-fit map expectation, independently of the optimizer.
 * @evidence contracts/testing.md#distinguishing-cases Covers many point blocks, a general dense camera tail, dense and sparse covectors, positive damping and a real source consumer with original rank/gauge/population. Nonlinear curved boundaries and abnormality are covered separately; this fixture is not photographic accuracy evidence.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_feasible_metric entry uses source numerical arrays only without compiler, installation, filesystem host, process, browser or GPU.
 */
export function test_recovery_feasible_metric(): void {
  const fixture: ReturnType<typeof createRecoveryMapNumericalFixture> =
    createRecoveryMapNumericalFixture();
  const landmarks: IAutoMovieRecoveryMapLandmark[] = fixture.points.map(
    (point: [number, number, number], at: number): IAutoMovieRecoveryMapLandmark => ({
      id: at, point: [...point], observations: [0, 1, 2].map(
        (viewIndex: number): IAutoMovieRecoveryMapLandmark["observations"][number] => ({
          viewIndex, featureIndex: at, pixel: [...fixture.pixels[viewIndex]![at]!],
        }),
      ),
    }),
  );
  let randomState: number = 91;
  const random: () => number = (): number => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 0x100000000 - 0.5;
  };
  const cameraWidth: number = 11,
    pointCount: number = 8,
    width: number = cameraWidth + 3 * pointCount;
  const blocks: Parameters<typeof solveRecoveryMapJointStep>[0] = Array.from(
    { length: pointCount },
    (): (typeof blocks)[number] => ({
      cameraRows: Array.from({ length: 6 }, (): number[] =>
        Array.from({ length: cameraWidth }, random),
      ),
      pointRows: Array.from({ length: 6 }, (): number[] =>
        Array.from({ length: 3 }, random),
      ),
      right: Array.from({ length: 6 }, random),
    }),
  );
  const damping: number = 0.03;
  const metric: NonNullable<
    ReturnType<typeof solveRecoveryMapJointStep>["metric"]
  > = solveRecoveryMapJointStep(
    blocks,
    1e-8,
    damping,
    fixture.input.budget,
    true,
  ).metric!;
  const metricStep: number[] = Array.from({ length: width }, random);
  const physical: number[] = metric.unwhiten(metricStep);
  const scales: number[] = new Array<number>(width).fill(0);
  let objective: number = 0;
  for (let point: number = 0; point < blocks.length; point++) {
    const block: (typeof blocks)[number] = blocks[point]!;
    for (let row: number = 0; row < block.right.length; row++) {
      let value: number = 0;
      for (let axis: number = 0; axis < cameraWidth; axis++) {
        value += block.cameraRows[row]![axis]! * physical[axis]!;
        scales[axis] = Math.hypot(scales[axis]!, block.cameraRows[row]![axis]!);
      }
      for (let axis: number = 0; axis < 3; axis++) {
        const at: number = cameraWidth + 3 * point + axis;
        value += block.pointRows[row]![axis]! * physical[at]!;
        scales[at] = Math.hypot(scales[at]!, block.pointRows[row]![axis]!);
      }
      objective += value * value;
    }
  }
  for (let axis: number = 0; axis < width; axis++)
    objective += damping * (scales[axis]! * physical[axis]!) ** 2;
  TestValidator.predicate(
    "full original metric norm is preserved",
    nclose(
      objective,
      metricStep.reduce(
        (sum: number, value: number): number => sum + value * value,
        0,
      ),
      1e-9,
    ),
  );
  const atoms: IAutoMovieSimplexAtom[] = [
    {
      indices: Array.from(
        { length: width },
        (_: unknown, at: number): number => at,
      ),
      values: Array.from({ length: width }, random),
      offset: 0,
    },
    {
      indices: [0, 5, cameraWidth + 9, cameraWidth + 10, cameraWidth + 11],
      values: [0.3, -0.2, 0.7, 0.1, -0.8],
      offset: 0.5,
    },
  ];
  for (const atom of atoms) {
    const whitened: IAutoMovieSimplexAtom = metric.whiten(atom);
    const actual: number = whitened.indices.reduce(
      (sum: number, axis: number, at: number): number =>
        sum + whitened.values[at]! * metricStep[axis]!,
      0,
    );
    const expected: number = atom.indices.reduce(
      (sum: number, axis: number, at: number): number =>
        sum + atom.values[at]! * physical[axis]!,
      0,
    );
    TestValidator.predicate(
      "inverse-transpose physical covector agrees",
      nclose(actual, expected, 1e-10) && whitened.offset === atom.offset,
    );
  }
  const intrinsics: number[][] = fixture.input.views.map(
    (view: (typeof fixture.input.views)[number]): number[] => createRecoveryCameraChart(view).matrix,
  );
  const inputBytes: string = JSON.stringify({ poses: fixture.poses, landmarks,
    intrinsics, policy: fixture.input.policy, budget: fixture.input.budget });
  const result: ReturnType<typeof refineRecoveryCameraMap> =
    refineRecoveryCameraMap(
      fixture.poses,
      landmarks,
      intrinsics,
      fixture.input.policy,
      fixture.input.budget,
      (): void => {},
      (): void => {},
      {
        directionBudget: {
          maxIterations: 1000,
          maxEntries: 100000,
          maxWork: 10000000,
        },
        maxResidentLinearEntries: 10000000,
      },
    );
  TestValidator.predicate(
    "actual joint consumer keeps exact population and normal gauge",
    result.report.converged &&
      result.report.termination === "pixel-kkt" &&
      result.report.observationCount ===
        landmarks.reduce(
          (sum: number, point: (typeof landmarks)[number]): number =>
            sum + point.observations.length,
          0,
        ) &&
      result.report.finalCost < 1e-12 &&
      nclose(Math.hypot(...result.poses[1]!.translation), 1, 1e-12) &&
      nclose(
        Math.hypot(...result.poses[2]!.translation),
        Math.hypot(...fixture.poses[2]!.translation),
        1e-12,
      ) &&
      JSON.stringify({ poses: fixture.poses, landmarks, intrinsics,
        policy: fixture.input.policy, budget: fixture.input.budget }) === inputBytes,
  );
  let earlyRefusals: number = 0;
  for (const limits of [
    { entries: 1, work: 10000000, resident: 10000000 },
    { entries: 100000, work: 1, resident: 10000000 },
    { entries: 100000, work: 10000000, resident: 1 },
  ]) {
    let spent: number = 0, trials: number = 0;
    try {
      refineRecoveryCameraMap(fixture.poses, landmarks,
        intrinsics, fixture.input.policy, fixture.input.budget,
        (): void => { trials++; }, (amount: number): void => { spent += amount; }, {
          directionBudget: { maxIterations: 1000, maxEntries: limits.entries, maxWork: limits.work },
          maxResidentLinearEntries: limits.resident,
        });
    } catch {
      if (trials === 0 && spent <= 4 * landmarks.length) earlyRefusals++;
    }
  }
  TestValidator.predicate("camera model capacity refuses before numerical fitting",
    earlyRefusals === 3 && JSON.stringify({ poses: fixture.poses, landmarks, intrinsics,
      policy: fixture.input.policy, budget: fixture.input.budget }) === inputBytes);
}
