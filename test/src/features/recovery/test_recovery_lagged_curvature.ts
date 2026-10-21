import { TestValidator } from "@nestia/e2e";

import { admitRecoveryMapCurvature } from "../../../../packages/recovery/src/internal/admitRecoveryMapCurvature";
import { assembleRecoveryMapCurvature } from "../../../../packages/recovery/src/internal/assembleRecoveryMapCurvature";
import { copyRecoveryUntiltedEstimate } from "../../../../packages/recovery/src/internal/copyRecoveryUntiltedEstimate";
import { createRecoveryCameraChart } from "../../../../packages/recovery/src/internal/createRecoveryCameraChart";
import { differentiateRecoveryMapProjection } from "../../../../packages/recovery/src/internal/differentiateRecoveryMapProjection";
import { refineRecoveryCameraMap } from "../../../../packages/recovery/src/internal/refineRecoveryCameraMap";
import type { IAutoMovieRecoveryMapLandmark } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoveryMapCurvatureBlocks } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryMapCurvatureBlocks";
import type { IAutoMovieRecoveryMapMetricScales } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryMapMetricScales";
import type { IAutoMovieRecoveryMapState } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryMapState";
import type { IAutoMovieRecoveryUntiltedEstimate } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryUntiltedEstimate";
import { assertRecoveryMapCurvatureFactor } from "../internal/assertRecoveryMapCurvatureFactor";
import { createRecoveryMapNumericalFixture } from "../internal/createRecoveryMapNumericalFixture";
import { nclose } from "../internal/nclose";

/**
 * Lagged local curvature has independent geometry, factor and owner expectations.
 *
 * Scenarios:
 * 1. Pinhole point/rotation-point Hessians and general seed normalization match closed derivatives; finite first-order depth need not support second derivatives.
 * 2. An authored offdiagonal arrowhead quadratic with nonunit D has the independent dense physical norm, inverse/transpose product and covector duality.
 * 3. Point, Schur and fixed-row arithmetic refusals are distinct from malformed or sparse-hole ownership; a later inverse overflow throws from the already selected factor.
 * 4. Owned dual copying distinguishes empty and null, survives source mutation, and propagates identity/charge errors. Resource admission distinguishes fixed, optional and materialization capacity.
 * 5. Real camera initial KKT preserves all four adaptive/lagged combinations, invalid SQP admission, capacity fallback and per-fit reset; a selected update reaches its next terminal model without another trial.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls local derivative/assembly, numerical factor/actions, precharged admission/copy and actual internal camera consumer. It observes physical quadratic identities, explicit refusal stages, owned copies, counters and original gauge/population without replacing foreign code.
 * @evidence contracts/testing.md#independent-expectations Authored quotient derivatives and Rodrigues second-order terms give scalar Hessian entries. A separately constructed upper factor defines dense H=D R^T R D independently of the factor under test. Fixed resource polynomials and original exact projected geometry define admission and initial KKT expectations; no helper output or convergence snapshot is its own oracle.
 * @evidence contracts/testing.md#distinguishing-cases Covers nonunit scales, offdiagonal point-camera coupling, seed Float normalization, near-depth second-order refusal, indefinite/overflow cases, empty/null/copy/reset and independent flags. Generic selected-path/borrowed notification and full original data-rank/gate/selector behavior are checked separately.
 * @evidence contracts/testing.md#execution-ownership Portable test_recovery_lagged_curvature uses resident authored arrays and source camera routines without images, filesystem, compiler, installed host, processes, browser or GPU.
 */
export function test_recovery_lagged_curvature(): void {
  const pose: IAutoMovieRecoveryMapPose = {
    rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    translation: [0, 0, 0],
  };
  const intrinsic: number[] = [2, 0.3, 0.1, 0, 3, 0.2, 0, 0, 1];
  const point: [number, number, number] = [0.4, -0.2, 2];
  const fixed: ReturnType<typeof differentiateRecoveryMapProjection> =
    differentiateRecoveryMapProjection(pose, point, intrinsic, []);
  const moving: ReturnType<typeof differentiateRecoveryMapProjection> =
    differentiateRecoveryMapProjection(pose, point, intrinsic, null);
  const tangent: [number, number, number][] = [
    [0, 1, 0],
    [0, 0, 1],
  ];
  const seedPose: IAutoMovieRecoveryMapPose = {
    ...pose,
    translation: [1 + 4e-11, 0, 0],
  };
  const sphere: ReturnType<typeof differentiateRecoveryMapProjection> =
    differentiateRecoveryMapProjection(seedPose, point, intrinsic, tangent);
  const seedNorm: number = 1 + 4e-11;
  const depthSeed: ReturnType<typeof differentiateRecoveryMapProjection> =
    differentiateRecoveryMapProjection(
      { ...pose, translation: [0, 0, seedNorm] },
      point,
      intrinsic,
      [
        [1, 0, 0],
        [0, 1, 0],
      ],
    );
  const currentDepth: number = 2 + seedNorm;
  const radiusHessian: number = 0.74 / (currentDepth ** 2 * seedNorm);
  const previousAnchoredHessian: number =
    0.74 / (currentDepth ** 2 * seedNorm ** 2);
  TestValidator.predicate(
    "independent quotient, rotation-point and general sphere derivatives",
    fixed !== null &&
      moving !== null &&
      sphere !== null &&
      nclose(fixed.hessians[0]![0]![2]!, -0.5, 1e-14) &&
      nclose(fixed.hessians[0]![1]![2]!, -0.075, 1e-14) &&
      nclose(fixed.hessians[0]![2]![2]!, 0.185, 1e-14) &&
      nclose(moving.hessians[0]![2]![6]!, 0.15, 1e-14) &&
      nclose(moving.hessians[1]![2]![6]!, 1.5, 1e-14) &&
      nclose(moving.hessians[0]![2]![2]!, -0.37, 1e-14) &&
      nclose(sphere.hessians[0]![3]![3]!, -1 / seedNorm, 1e-14) &&
      depthSeed !== null &&
      nclose(depthSeed.pixel[0], 0.74 / currentDepth + 0.1, 1e-15) &&
      nclose(depthSeed.hessians[0]![3]![3]!, radiusHessian, 1e-14) &&
      Math.abs(radiusHessian - previousAnchoredHessian) > 1e-13 &&
      differentiateRecoveryMapProjection(
        pose,
        [0, 0, 1e-200],
        intrinsic,
        [],
      ) === null,
  );
  assertRecoveryMapCurvatureFactor(pose, seedPose, point, intrinsic);
  const borrowed: IAutoMovieRecoveryUntiltedEstimate = {
    width: 8,
    rowCount: 3,
    selected: [1],
    multipliers: [0.4],
  };
  let copyWork: number = 0;
  const copied: IAutoMovieRecoveryUntiltedEstimate | null =
    copyRecoveryUntiltedEstimate(borrowed, 8, 3, (work: number): void => {
      copyWork += work;
    });
  (borrowed.multipliers as number[])[0] = 9;
  const empty: IAutoMovieRecoveryUntiltedEstimate | null =
    copyRecoveryUntiltedEstimate(
      { width: 8, rowCount: 3, selected: [], multipliers: [] },
      8,
      3,
      (work: number): void => {
        copyWork += work;
      },
    );
  const cleared: IAutoMovieRecoveryUntiltedEstimate | null =
    copyRecoveryUntiltedEstimate(null, 8, 3, (work: number): void => {
      copyWork += work;
    });
  const marker: Error = new Error("curvature-owner-charge");
  let chargeError: boolean = false,
    identityError: boolean = false;
  try {
    copyRecoveryUntiltedEstimate(borrowed, 8, 3, (): void => {
      throw marker;
    });
  } catch (error: unknown) {
    chargeError = error === marker;
  }
  try {
    copyRecoveryUntiltedEstimate(borrowed, 9, 3, (): void => {});
  } catch {
    identityError = true;
  }
  TestValidator.predicate(
    "seed copies own their arrays and distinguish empty, null and errors",
    copied !== null &&
      copied.multipliers[0] === 0.4 &&
      empty !== null &&
      empty.selected.length === 0 &&
      cleared === null &&
      copyWork === 256 &&
      chargeError &&
      identityError,
  );
  let setup: number = 0;
  const admitted: ReturnType<typeof admitRecoveryMapCurvature> =
    admitRecoveryMapCurvature(
      5,
      6,
      18,
      10000,
      1000000,
      1000000,
      (work: number): void => {
        setup += work;
      },
    );
  const limited: ReturnType<typeof admitRecoveryMapCurvature> =
    admitRecoveryMapCurvature(
      5,
      6,
      18,
      10000,
      1000000,
      1,
      (work: number): void => {
        setup += work;
      },
    );
  let fixedRefusal: boolean = false;
  try {
    admitRecoveryMapCurvature(5, 6, 18, 10000, 10000, 1000000, (): void => {});
  } catch {
    fixedRefusal = true;
  }
  TestValidator.predicate(
    "optional materialization and fixed requested retention remain separate",
    admitted.eligible &&
      admitted.retainedEntries === 21800 &&
      admitted.work === 2595584 &&
      !limited.eligible &&
      limited.retainedEntries === 10256 &&
      setup === 1024 &&
      fixedRefusal,
  );
  const fixture: ReturnType<typeof createRecoveryMapNumericalFixture> =
    createRecoveryMapNumericalFixture();
  const intrinsics: number[][] = fixture.input.views.map(
    (view: (typeof fixture.input.views)[number]): number[] =>
      createRecoveryCameraChart(view).matrix,
  );
  const landmarks: IAutoMovieRecoveryMapLandmark[] = fixture.points.map(
    (
      value: [number, number, number],
      at: number,
    ): IAutoMovieRecoveryMapLandmark => ({
      id: at,
      point: [...value],
      observations: [0, 1, 2].map(
        (
          viewIndex: number,
        ): IAutoMovieRecoveryMapLandmark["observations"][number] => ({
          viewIndex,
          featureIndex: at,
          pixel: [...fixture.pixels[viewIndex]![at]!],
        }),
      ),
    }),
  );
  const unchanged: string = JSON.stringify({ poses: fixture.poses, landmarks });
  for (const adaptive of [false, true])
    for (const lagged of [false, true]) {
      const fit: ReturnType<typeof refineRecoveryCameraMap> =
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
              maxIterations: 10000,
              maxEntries: 1000000,
              maxWork: 1000000000,
            },
            maxResidentLinearEntries: 10000000,
            sqpAcceleration: true,
            adaptiveRegularization: adaptive,
            laggedLagrangianMetric: lagged,
          },
        );
      TestValidator.predicate(
        `initial KKT preserves independent flags ${adaptive}/${lagged}`,
        fit.report.converged &&
          fit.report.iterations === 0 &&
          fit.report.acceptedSteps === 0 &&
          (fit.report.regularization !== undefined) === adaptive &&
          (fit.report.curvature !== undefined) === lagged &&
          (!lagged ||
            (!fit.report.curvature!.eligible &&
              fit.report.curvature!.models === 1 &&
              fit.report.curvature!.capacity === 1 &&
              fit.report.curvature!.noSeed === 0 &&
              fit.report.curvature!.attempted === 0)),
      );
    }
  // Two calibrated cameras and six nonplanar points pin the minimum admitted
  // joint shape; the original forty-point fixture/thresholds above stay intact.
  const minimum: IAutoMovieRecoveryMapLandmark[] = landmarks.slice(0, 6).map(
    (
      landmark: IAutoMovieRecoveryMapLandmark,
    ): IAutoMovieRecoveryMapLandmark => ({
      ...landmark,
      point: [...landmark.point],
      observations: landmark.observations.slice(0, 2),
    }),
  );
  minimum[0]!.point[0] += 1e-5;
  const minimumUnchanged: string = JSON.stringify(minimum);
  for (const adaptive of [false, true]) {
    const fit: ReturnType<typeof refineRecoveryCameraMap> =
      refineRecoveryCameraMap(
        fixture.poses.slice(0, 2),
        minimum,
        intrinsics.slice(0, 2),
        fixture.input.policy,
        { ...fixture.input.budget, maxRefinementIterations: 2 },
        (): void => {},
        (): void => {},
        {
          directionBudget: {
            maxIterations: 10000,
            maxEntries: 1000000,
            maxWork: 1000000000,
          },
          maxResidentLinearEntries: 10000000,
          sqpAcceleration: true,
          adaptiveRegularization: adaptive,
          laggedLagrangianMetric: true,
        },
      );
    TestValidator.predicate(
      `selected reaction reaches next existing terminal model ${adaptive}`,
      fit.report.iterations <= 2 &&
        fit.report.acceptedSteps === 1 &&
        fit.report.curvature!.eligible &&
        fit.report.curvature!.models === 2 &&
        fit.report.curvature!.noSeed === 1 &&
        fit.report.curvature!.attempted === 1 &&
        fit.report.curvature!.supported + fit.report.curvature!.refused === 1 &&
        fit.report.finalCost < fit.report.initialCost &&
        (fit.report.regularization === undefined
          ? !adaptive
          : fit.report.regularization.supportedUpdates +
              fit.report.regularization.unsupportedUpdates ===
            1),
    );
  }
  let invalid: boolean = false;
  try {
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
          maxIterations: 10000,
          maxEntries: 1000000,
          maxWork: 1000000000,
        },
        maxResidentLinearEntries: 10000000,
        laggedLagrangianMetric: true,
      },
    );
  } catch {
    invalid = true;
  }
  let rankRefused: boolean = false,
    optionalGeometryVisits: number = 0;
  try {
    refineRecoveryCameraMap(
      fixture.poses.slice(0, 2),
      minimum.map(
        (
          landmark: IAutoMovieRecoveryMapLandmark,
        ): IAutoMovieRecoveryMapLandmark => ({
          ...landmark,
          point: [...minimum[0]!.point],
          observations: minimum[0]!.observations.map(
            (
              observation: IAutoMovieRecoveryMapLandmark["observations"][number],
            ): IAutoMovieRecoveryMapLandmark["observations"][number] => ({
              ...observation,
              featureIndex: landmark.id,
            }),
          ),
        }),
      ),
      intrinsics.slice(0, 2),
      fixture.input.policy,
      fixture.input.budget,
      (): void => {},
      (work: number): void => {
        if (work === 1789184) optionalGeometryVisits++;
      },
      {
        directionBudget: {
          maxIterations: 10000,
          maxEntries: 1000000,
          maxWork: 1000000000,
        },
        maxResidentLinearEntries: 10000000,
        sqpAcceleration: true,
        laggedLagrangianMetric: true,
      },
    );
  } catch (error: unknown) {
    rankRefused =
      error instanceof Error && error.message.includes("rank-degenerate");
  }
  TestValidator.predicate(
    "new fits reset seeds and preserve original rank and borrowed geometry",
    invalid &&
      rankRefused &&
      optionalGeometryVisits === 0 &&
      JSON.stringify({ poses: fixture.poses, landmarks }) === unchanged &&
      JSON.stringify(minimum) === minimumUnchanged,
  );
  const state: IAutoMovieRecoveryMapState = {
    poses: [pose, { ...pose, translation: [1, 0, 0] }],
    landmarks: [
      {
        id: 0,
        point,
        observations: [{ viewIndex: 0, featureIndex: 0, pixel: [0.37, -0.3] }],
      },
    ],
  };
  const scalarScales: IAutoMovieRecoveryMapMetricScales = {
    cameraScales: [1, 1, 1, 1, 1],
    pointScales: [[1, 1, 1]],
  };
  let assemblyHole: boolean = false;
  try {
    assembleRecoveryMapCurvature(
      state,
      [intrinsic, intrinsic],
      fixture.input.policy,
      { width: 8, rowCount: 2, selected: [], multipliers: [] },
      { cameraScales: new Array<number>(5), pointScales: [[1, 1, 1]] },
      0.1,
    );
  } catch {
    assemblyHole = true;
  }
  TestValidator.predicate(
    "assembly validates every scale before local formation",
    assemblyHole,
  );
  const localBlocks: IAutoMovieRecoveryMapCurvatureBlocks | null =
    assembleRecoveryMapCurvature(
      state,
      [intrinsic, intrinsic],
      fixture.input.policy,
      { width: 8, rowCount: 2, selected: [1], multipliers: [0.4] },
      scalarScales,
      0.1,
    );
  const e0: number = 0.1,
    e1: number = 0.2;
  const h: number = Math.hypot(
    1,
    Math.hypot(e0, e1) / fixture.input.policy.lossScalePx,
  );
  const expected: number =
    0.1 +
    1 / h -
    (e0 * e0) / (fixture.input.policy.lossScalePx ** 2 * h ** 3) +
    0.8 / fixture.input.policy.maximumReprojectionErrorPx ** 2;
  TestValidator.predicate(
    "independent soft-L1 plus fixed original-disk Hessian assembly",
    localBlocks !== null &&
      nclose(localBlocks.points[0]![0]![0]!, expected, 1e-13),
  );
}
