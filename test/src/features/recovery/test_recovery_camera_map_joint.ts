import { decomposeAutoMovieSingularMatrix } from "@automovie/engine/math/decomposeAutoMovieSingularMatrix";
import { TestValidator } from "@nestia/e2e";

import { createRecoveryCameraChart } from "../../../../packages/recovery/src/internal/createRecoveryCameraChart";
import { createRecoveryMapTangent } from "../../../../packages/recovery/src/internal/createRecoveryMapTangent";
import { refineRecoveryCameraMap } from "../../../../packages/recovery/src/internal/refineRecoveryCameraMap";
import { solveRecoveryMapJointStep } from "../../../../packages/recovery/src/internal/solveRecoveryMapJointStep";
import { stepRecoveryMapPose } from "../../../../packages/recovery/src/internal/stepRecoveryMapPose";
import { stepRecoveryRelativePose } from "../../../../packages/recovery/src/internal/stepRecoveryRelativePose";
import type { IAutoMovieRecoveryMapLandmark } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapPose";
import { createRecoveryMapNumericalFixture } from "../internal/createRecoveryMapNumericalFixture";
import { nclose } from "../internal/nclose";

/**
 * Point-local orthogonal elimination solves the complete gauge-fixed objective.
 *
 * Scenarios:
 * 1. Undamped and damped block-QR steps agree with independently assembled full original-design SVD over all camera and point variables.
 * 2. Perturbed nonplanar cameras/points and missing third observations jointly converge toward prescribed geometry with the first pose and seed scale unchanged. Every ordinary trial prepays256 chart-update and512 differential visits.
 * 3. Singular point blocks, an unobservable third camera, a nonorigin first-camera gauge and iteration exhaustion cannot become a completed accepted refinement.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual block step and joint optimizer, comparing every camera/point delta and actual fixed-population cost, pose, baseline and work outcome. It detects inconsistent damping, omitted point terms, wrong gauge, extra translation normalization and falsely accepted unobservable fits.
 * @evidence contracts/testing.md#independent-expectations A separately assembled complete column-normalized augmented design includes every point/camera variable and identical diagonal damping; its SVD solution is an independent elimination oracle. Prescribed trig rotations and scalar pinhole projections supply nonlinear geometry truth. Shared SVD arithmetic is not an independent decomposition-accuracy reference.
 * @evidence contracts/testing.md#distinguishing-cases Covers zero/positive damping, arbitrary nonsymmetric block data, all returned coordinates, point-rank loss, sparse missing observations, nonunit third translation, unchanged first pose, unit seed baseline, common observation count and one-step nonconvergence. Resection and public-image admission have separate tests.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_camera_map_joint entry uses resident numerical arrays only; it starts no compiler, process, installation, filesystem host, browser or GPU and replaces no foreign method.
 */
export function test_recovery_camera_map_joint(): void {
  const fixture: ReturnType<typeof createRecoveryMapNumericalFixture> =
    createRecoveryMapNumericalFixture();
  let state: number = 17;
  const random: () => number = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000 - 0.5;
  };
  const blocks: Parameters<typeof solveRecoveryMapJointStep>[0] = Array.from(
    { length: 8 },
    (): (typeof blocks)[number] => ({
      pointRows: Array.from({ length: 6 }, (): number[] =>
        Array.from({ length: 3 }, random),
      ),
      cameraRows: Array.from({ length: 6 }, (): number[] =>
        Array.from({ length: 11 }, random),
      ),
      right: Array.from({ length: 6 }, random),
    }),
  );
  for (const damping of [0, 0.03]) {
    const actual: ReturnType<typeof solveRecoveryMapJointStep> =
      solveRecoveryMapJointStep(blocks, 1e-8, damping, fixture.input.budget);
    const width: number = 11 + 3 * blocks.length,
      rows: number[][] = [],
      right: number[] = [];
    for (let at: number = 0; at < blocks.length; at++)
      for (let row: number = 0; row < 6; row++) {
        const values: number[] = new Array<number>(width).fill(0);
        for (let column: number = 0; column < 11; column++)
          values[column] = blocks[at]!.cameraRows[row]![column]!;
        for (let column: number = 0; column < 3; column++)
          values[11 + 3 * at + column] = blocks[at]!.pointRows[row]![column]!;
        rows.push(values);
        right.push(blocks[at]!.right[row]!);
      }
    const scales: number[] = Array.from(
      { length: width },
      (_: unknown, column: number): number =>
        Math.hypot(...rows.map((row: number[]): number => row[column]!)),
    );
    const normalized: number[][] = rows.map((row: number[]): number[] =>
      row.map((value: number, at: number): number => value / scales[at]!),
    );
    if (damping > 0)
      for (let row: number = 0; row < width; row++) {
        normalized.push(
          Array.from({ length: width }, (_: unknown, column: number): number =>
            row === column ? Math.sqrt(damping) : 0,
          ),
        );
        right.push(0);
      }
    const factors: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
      decomposeAutoMovieSingularMatrix(normalized, {
        maxEntries: 12000,
        maxSweeps: 128,
        orthogonalityTolerance: 1e-12,
      });
    const expected: number[] = new Array<number>(width).fill(0);
    for (let component: number = 0; component < width; component++) {
      const coefficient: number =
        right.reduce(
          (sum: number, value: number, at: number): number =>
            sum + value * factors.leftColumns[component]![at]!,
          0,
        ) / factors.singularValues[component]!;
      for (let column: number = 0; column < width; column++)
        expected[column] +=
          (coefficient * factors.rightColumns[component]![column]!) /
          scales[column]!;
    }
    const observed: number[] = [
      ...actual.cameraStep,
      ...actual.pointSteps.flat(),
    ];
    TestValidator.predicate(
      `point-local elimination equals full original-design solution at damping ${damping}`,
      expected.every((value: number, at: number): boolean =>
        nclose(value, observed[at]!, 1e-7),
      ),
    );
  }
  let singular: boolean = false;
  try {
    solveRecoveryMapJointStep(
      [
        {
          ...blocks[0]!,
          pointRows: blocks[0]!.pointRows.map((): number[] => [0, 0, 0]),
        },
        ...blocks.slice(1),
      ],
      1e-8,
      1,
      fixture.input.budget,
    );
  } catch {
    singular = true;
  }
  TestValidator.predicate(
    "damping never rescues an unresolved point block",
    singular,
  );
  const initialPoses: IAutoMovieRecoveryMapPose[] = [
    fixture.poses[0]!,
    stepRecoveryRelativePose(
      fixture.poses[1]!,
      createRecoveryMapTangent(fixture.poses[1]!.translation),
      [0.003, -0.004, 0.002, 0.004, -0.003],
    ),
    stepRecoveryMapPose(
      fixture.poses[2]!,
      [-0.004, 0.005, 0.002, 0.02, -0.01, 0.01],
    ),
  ];
  const landmarks: IAutoMovieRecoveryMapLandmark[] = fixture.points.map(
    (
      point: [number, number, number],
      at: number,
    ): IAutoMovieRecoveryMapLandmark => ({
      id: at,
      point: [point[0] + 0.005, point[1] - 0.004, point[2] + 0.008],
      observations: [0, 1, 2]
        .filter((view: number): boolean => view !== 2 || at % 4 !== 0)
        .map(
          (
            view: number,
          ): IAutoMovieRecoveryMapLandmark["observations"][number] => ({
            viewIndex: view,
            featureIndex: at,
            pixel: [...fixture.pixels[view]![at]!],
          }),
        ),
    }),
  );
  const intrinsics: number[][] = fixture.input.views.map(
    (view: (typeof fixture.input.views)[number]): number[] =>
      createRecoveryCameraChart(view).matrix,
  );
  const original: string = JSON.stringify({ initialPoses, landmarks });
  let chartTrials: number = 0,
    chartDesigns: number = 0;
  const result: ReturnType<typeof refineRecoveryCameraMap> =
    refineRecoveryCameraMap(
      initialPoses,
      landmarks,
      intrinsics,
      fixture.input.policy,
      fixture.input.budget,
      (): void => {},
      (amount: number): void => {
        if (amount === 256) chartTrials++;
        if (amount === 512) chartDesigns++;
      },
    );
  TestValidator.predicate(
    "joint fit preserves gauge and complete retained population",
    result.report.converged &&
      chartTrials > 0 &&
      chartTrials === chartDesigns &&
      result.report.finalCost < result.report.initialCost &&
      result.report.observationCount === 110 &&
      result.landmarks.length === 40 &&
      result.poses[0]!.rotation.every(
        (value: number, at: number): boolean =>
          value === initialPoses[0]!.rotation[at],
      ) &&
      result.poses[0]!.translation.every(
        (value: number): boolean => value === 0,
      ) &&
      nclose(Math.hypot(...result.poses[1]!.translation), 1, 1e-12) &&
      Math.hypot(...result.poses[2]!.translation) > 1.5,
  );
  TestValidator.predicate(
    "joint cameras and points approach independent physical geometry without mutating inputs",
    result.poses[2]!.translation.every((value: number, at: number): boolean =>
      nclose(value, fixture.poses[2]!.translation[at]!, 1e-4),
    ) &&
      result.landmarks.every(
        (landmark: IAutoMovieRecoveryMapLandmark, at: number): boolean =>
          landmark.point.every((value: number, axis: number): boolean =>
            nclose(value, fixture.points[at]![axis]!, 1e-3),
          ),
      ) &&
      JSON.stringify({ initialPoses, landmarks }) === original,
  );
  const unfinished: ReturnType<typeof refineRecoveryCameraMap> =
    refineRecoveryCameraMap(
      initialPoses,
      landmarks,
      intrinsics,
      fixture.input.policy,
      { ...fixture.input.budget, maxRefinementIterations: 1 },
      (): void => {},
    );
  TestValidator.predicate(
    "one accepted descent step is not convergence",
    !unfinished.report.converged &&
      unfinished.report.termination === "iteration-budget",
  );
  let disconnected: boolean = false;
  try {
    refineRecoveryCameraMap(
      initialPoses,
      landmarks.map(
        (
          landmark: IAutoMovieRecoveryMapLandmark,
        ): IAutoMovieRecoveryMapLandmark => ({
          ...landmark,
          observations: landmark.observations.filter(
            (observation: (typeof landmark.observations)[number]): boolean =>
              observation.viewIndex !== 2,
          ),
        }),
      ),
      intrinsics,
      fixture.input.policy,
      fixture.input.budget,
      (): void => {},
    );
  } catch {
    disconnected = true;
  }
  TestValidator.predicate(
    "unobserved third camera cannot pass a damped solve",
    disconnected,
  );
  let wrongOrigin: boolean = false;
  try {
    refineRecoveryCameraMap(
      [
        { ...initialPoses[0]!, translation: [1, 0, 0] },
        initialPoses[1]!,
        initialPoses[2]!,
      ],
      landmarks,
      intrinsics,
      fixture.input.policy,
      fixture.input.budget,
      (): void => {},
    );
  } catch {
    wrongOrigin = true;
  }
  TestValidator.predicate(
    "a nonorigin first camera cannot redefine the declared seed-length gauge",
    wrongOrigin,
  );
}
