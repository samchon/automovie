import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieSimplexAtom } from "../../../../packages/engine/src/math/IAutoMovieSimplexAtom";
import type { IAutoMovieRecoveryMapLandmark } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapLandmark";
import { createRecoveryCameraChart } from "../../../../packages/recovery/src/internal/createRecoveryCameraChart";
import { factorRecoveryMapDesign } from "../../../../packages/recovery/src/internal/factorRecoveryMapDesign";
import { factorRecoveryMapMetric } from "../../../../packages/recovery/src/internal/factorRecoveryMapMetric";
import { prepareRecoveryMapJointBlocks } from "../../../../packages/recovery/src/internal/prepareRecoveryMapJointBlocks";
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
 * 5. Pushing a metric covector matches independently assembled J^T*J*p plus unchanged column-scaled damping in original physical units.
 * 6. Metric-only and complete-step operations preserve zero/positive-damping actions and independent ranks; short/tall original factors retain their documented aliases, while invalid rank, finite input and capacity refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls metric-only preparation/factorization, complete-step factor retention and the actual opt-in map joint consumer. Independent original-design products catch mismatched column scales, point/camera permutation, wrong triangular transpose or dropped damping; direct LS residual gradients continue to check the ordinary answer.
 * @evidence contracts/testing.md#independent-expectations Authored rows and global norms give ||J*p||^2+delta*||D*p||^2=||z||^2 and covector duality. An independently assembled J^T*(J*step-right)+delta*D^2*step must vanish for the full LS answer. Two-column normalized Gram eigenvalues1+/-correlation determine short/tall rank ratios. Exact scalar-projected geometry supplies the zero-fit map independently of the optimizer.
 * @evidence contracts/testing.md#distinguishing-cases Covers metric-only versus full operation, optional gradient null, zero/positive damping, short/tall original factors, point/camera rank refusal, nonfinite right and capacity, dense/sparse covectors and the actual gauge/population consumer. Nonlinear curved boundaries and abnormality are covered separately; this is not photographic accuracy evidence.
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
  const inputBlocks: string = JSON.stringify(blocks);
  const damping: number = 0.03;
  const original: ReturnType<typeof solveRecoveryMapJointStep> = solveRecoveryMapJointStep(
    blocks,
    1e-8,
    damping,
    fixture.input.budget,
    true,
  );
  const factored: ReturnType<typeof factorRecoveryMapMetric> = factorRecoveryMapMetric(
    blocks, 1e-8, damping, fixture.input.budget,
  );
  const metric: (typeof factored)["metric"] = factored.metric;
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
  const originalPhysical: number[] = original.metric!.unwhiten(metricStep);
  const zero: ReturnType<typeof factorRecoveryMapMetric> = factorRecoveryMapMetric(blocks, 1e-8, 0, fixture.input.budget);
  const originalZero: ReturnType<typeof solveRecoveryMapJointStep> = solveRecoveryMapJointStep(blocks, 1e-8, 0, fixture.input.budget, true);
  const zeroPhysical: number[] = zero.metric.unwhiten(metricStep);
  const originalZeroPhysical: number[] = originalZero.metric!.unwhiten(metricStep);
  TestValidator.predicate("demand-only raw metrics retain both admitted damping actions",
    physical.every((value: number, at: number): boolean => Object.is(value, originalPhysical[at])) &&
    zeroPhysical.every((value: number, at: number): boolean => Object.is(value, originalZeroPhysical[at])) &&
    factored.cameraDesignRatio === original.cameraDesignRatio &&
    factored.minimumPointDesignRatio === original.minimumPointDesignRatio &&
    zero.cameraDesignRatio === originalZero.cameraDesignRatio);
  const fullStep: number[] = [...original.cameraStep, ...original.pointSteps.flat()];
  const lsGradient: number[] = fullStep.map((value: number, at: number): number => damping * scales[at]! ** 2 * value);
  const rawGradient: number[] = new Array<number>(width).fill(0);
  let zeroObjective: number = 0;
  for (let point: number = 0; point < blocks.length; point++) {
    const block: (typeof blocks)[number] = blocks[point]!;
    for (let row: number = 0; row < block.right.length; row++) {
      let residual: number = -block.right[row]!, zeroValue: number = 0;
      for (let axis: number = 0; axis < cameraWidth; axis++) {
        residual += block.cameraRows[row]![axis]! * fullStep[axis]!;
        zeroValue += block.cameraRows[row]![axis]! * zeroPhysical[axis]!;
      }
      for (let axis: number = 0; axis < 3; axis++) {
        residual += block.pointRows[row]![axis]! * fullStep[cameraWidth + 3 * point + axis]!;
        zeroValue += block.pointRows[row]![axis]! * zeroPhysical[cameraWidth + 3 * point + axis]!;
      }
      zeroObjective += zeroValue * zeroValue;
      for (let axis: number = 0; axis < cameraWidth; axis++) {
        lsGradient[axis]! += block.cameraRows[row]![axis]! * residual;
        rawGradient[axis]! += block.cameraRows[row]![axis]! * block.right[row]!;
      }
      for (let axis: number = 0; axis < 3; axis++) {
        const at: number = cameraWidth + 3 * point + axis;
        lsGradient[at]! += block.pointRows[row]![axis]! * residual;
        rawGradient[at]! += block.pointRows[row]![axis]! * block.right[row]!;
      }
    }
  }
  const measured: ReturnType<typeof prepareRecoveryMapJointBlocks> = prepareRecoveryMapJointBlocks(blocks, 1e-8, fixture.input.budget, true);
  const unmeasured: ReturnType<typeof prepareRecoveryMapJointBlocks> = prepareRecoveryMapJointBlocks(blocks, 1e-8, fixture.input.budget, false);
  const expectedScaledGradient: number = rawGradient.reduce((maximum: number, value: number, at: number): number => Math.max(maximum, Math.abs(value / scales[at]!)), 0);
  TestValidator.predicate("complete LS answer and optional scaled gradient keep their own contracts",
    lsGradient.every((value: number): boolean => Math.abs(value) < 1e-9) &&
    nclose(zeroObjective, metricStep.reduce((sum: number, value: number): number => sum + value * value, 0), 1e-9) &&
    nclose(measured.gradient!, expectedScaledGradient, 1e-12) && unmeasured.gradient === null && JSON.stringify(blocks) === inputBlocks);
  const shortRight: number[] = [1, 2, 3], tallRight: number[] = [1, 2, 3, 4];
  const short: ReturnType<typeof factorRecoveryMapDesign> = factorRecoveryMapDesign([[1, 0], [0, 2], [1, 1]], shortRight, 1e-8, fixture.input.budget);
  const tall: ReturnType<typeof factorRecoveryMapDesign> = factorRecoveryMapDesign([[1, 0], [0, 2], [1, 1], [-1, 2]], tallRight, 1e-8, fixture.input.budget);
  const shortCorrelation: number = 1 / Math.sqrt(10), tallCorrelation: number = 1 / Math.sqrt(27);
  TestValidator.predicate("original short/tall rank and right ownership",
    short.solveRows === short.rows && short.solveRight === shortRight && tall.solveRows !== tall.rows && tall.solveRight !== tallRight &&
    nclose(short.designRatio, Math.sqrt((1 - shortCorrelation) / (1 + shortCorrelation)), 1e-12) &&
    nclose(tall.designRatio, Math.sqrt((1 - tallCorrelation) / (1 + tallCorrelation)), 1e-12));
  let refusedFactors: number = 0;
  try { factorRecoveryMapMetric(blocks, 1e-8, damping, { ...fixture.input.budget, maxLinearEntries: 1 }); } catch { refusedFactors++; }
  try { factorRecoveryMapMetric(blocks.map((block: (typeof blocks)[number]): (typeof blocks)[number] => ({ ...block, pointRows: block.pointRows.map((): number[] => [1, 1, 1]) })), 1e-8, damping, fixture.input.budget); } catch { refusedFactors++; }
  try { factorRecoveryMapMetric(blocks.map((block: (typeof blocks)[number]): (typeof blocks)[number] => ({ ...block, cameraRows: block.cameraRows.map((): number[] => new Array<number>(cameraWidth).fill(1)) })), 1e-8, damping, fixture.input.budget); } catch { refusedFactors++; }
  try { factorRecoveryMapMetric([{ ...blocks[0]!, right: [Infinity, 0, 0, 0, 0, 0] }, ...blocks.slice(1)], 1e-8, damping, fixture.input.budget); } catch { refusedFactors++; }
  TestValidator.predicate("metric-only input/rank/capacity refusal remains independent of damping",
    refusedFactors === 4 && JSON.stringify(blocks) === inputBlocks);
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
  const pushed: number[] = metric.toPhysicalCovector(metricStep);
  const expectedGradient: number[] = physical.map(
    (value: number, at: number): number => damping * scales[at]! * scales[at]! * value,
  );
  for (let point: number = 0; point < blocks.length; point++) {
    const block: (typeof blocks)[number] = blocks[point]!;
    for (let row: number = 0; row < block.right.length; row++) {
      let value: number = 0;
      for (let axis: number = 0; axis < cameraWidth; axis++) value += block.cameraRows[row]![axis]! * physical[axis]!;
      for (let axis: number = 0; axis < 3; axis++) value += block.pointRows[row]![axis]! * physical[cameraWidth + 3 * point + axis]!;
      for (let axis: number = 0; axis < cameraWidth; axis++) expectedGradient[axis]! += block.cameraRows[row]![axis]! * value;
      for (let axis: number = 0; axis < 3; axis++) expectedGradient[cameraWidth + 3 * point + axis]! += block.pointRows[row]![axis]! * value;
    }
  }
  TestValidator.predicate("physical covector push matches direct original damped design",
    pushed.every((value: number, at: number): boolean => nclose(value, expectedGradient[at]!, 1e-9)),
  );
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
