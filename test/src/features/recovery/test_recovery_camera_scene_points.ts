import { TestValidator } from "@nestia/e2e";

import { admitRecoveryCameraScene } from "../../../../packages/recovery/src/internal/admitRecoveryCameraScene";
import { evaluateRecoveryScenePoint } from "../../../../packages/recovery/src/internal/evaluateRecoveryScenePoint";
import { refineRecoveryCameraMap } from "../../../../packages/recovery/src/internal/refineRecoveryCameraMap";
import { triangulateRecoverySceneTrack } from "../../../../packages/recovery/src/internal/triangulateRecoverySceneTrack";
import type { IAutoMovieRecoveryMapObservation } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapObservation";
import type { IAutoMovieRecoveryMapPose } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapPose";
import { createRecoverySceneNumericalFixture } from "../internal/createRecoverySceneNumericalFixture";
import { nclose } from "../internal/nclose";

/**
 * A new point uses its actual registered rays rather than assumed seed visibility.
 *
 * Scenarios:
 * 1. A point seen only in views two/three/four triangulates in the shared gauge and exposes its real strongest acute supporting pair.
 * 2. Missing/duplicate/unregistered observations, zero-baseline rays, nonpositive depth and an inconsistent retained pixel refuse independently.
 * 3. A borrowed raw-norm observer preserves diagnostics and ordered independent robust cost/SSE, exposes partial rejected measurements without acceptance, and propagates its original error.
 * 4. The actual feasible map's initial evaluation rejects a final unsupported measurement before checking a nonfinite partial objective, without any trial or input mutation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls multiview DLT, point qualification and the actual feasible map's initial evaluation. Independent depth/pixel gates, ordered residual reduction and the map's original initial-feasibility error distinguish geometric refusal from premature objective-overflow failure.
 * @evidence contracts/testing.md#independent-expectations Prescribed coordinates and independent scalar R*X+t/pinhole equations define pixels, ordered residual norms and vector soft-L1/SSE sums. Reflected world Z gives negative depth and coincident poses cannot supply parallax; these are analytic conditions rather than photographed truth.
 * @evidence contracts/testing.md#distinguishing-cases Covers two/three observations without seeds, actual global indices, duplicate/absent support, coincident rays, behind geometry and bad pixels. Observer presence leaves full diagnostics unchanged; later refusal can retain raw nonfinite partial observations, which are discarded before objective checks, and original callback errors propagate without input mutation.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_camera_scene_points entry runs resident arrays only without a file/process/compiler/installation/browser/GPU host.
 */
export function test_recovery_camera_scene_points(): void {
  const fixture: ReturnType<typeof createRecoverySceneNumericalFixture> =
    createRecoverySceneNumericalFixture();
  const charts: ReturnType<typeof admitRecoveryCameraScene> =
    admitRecoveryCameraScene(fixture.input);
  const observations: IAutoMovieRecoveryMapObservation[] = [2, 3, 4].map(
    (viewIndex: number): IAutoMovieRecoveryMapObservation => {
      const featureIndex: number = fixture.identities[viewIndex]!.indexOf(48);
      return {
        viewIndex,
        featureIndex,
        pixel: [...fixture.features[viewIndex]!.points[featureIndex]!.point],
      };
    },
  );
  const originalBytes: string = JSON.stringify({ observations, poses: fixture.poses, points: fixture.points, charts });
  for (const subset of [observations.slice(0, 2), observations]) {
    const result: ReturnType<typeof triangulateRecoverySceneTrack> =
      triangulateRecoverySceneTrack(
        subset,
        fixture.poses,
        charts,
        fixture.input.policy,
        fixture.input.budget,
      );
    TestValidator.predicate(
      "point absent from seed triangulates in common coordinates",
      result.point !== null &&
        result.point.every((value: number, at: number): boolean =>
          nclose(value, fixture.points[48]![at]!, 1e-7),
        ),
    );
    const support: ReturnType<typeof evaluateRecoveryScenePoint> =
      evaluateRecoveryScenePoint(
        result.point!,
        subset,
        fixture.poses,
        charts,
        fixture.input.policy,
      );
    TestValidator.predicate(
      "strongest pair is actually observed",
      support.accepted &&
        support.supportingViews !== null &&
        support.supportingViews.every((view: number): boolean =>
          subset.some(
            (item: IAutoMovieRecoveryMapObservation): boolean =>
              item.viewIndex === view,
          ),
        ) &&
        support.minimumDepth !== null &&
        support.minimumDepth > 0,
    );
  }
  const unregistered: (IAutoMovieRecoveryMapPose | null)[] =
    fixture.poses.slice();
  unregistered[3] = null;
  const badPixel: IAutoMovieRecoveryMapObservation[] = observations.map(
    (
      observation: IAutoMovieRecoveryMapObservation,
      at: number,
    ): IAutoMovieRecoveryMapObservation => ({
      ...observation,
      pixel: [
        observation.pixel[0] + (at === 2 ? 100 : 0),
        observation.pixel[1],
      ],
    }),
  );
  const coincident: IAutoMovieRecoveryMapPose[] = fixture.poses.map(
    (): IAutoMovieRecoveryMapPose => fixture.poses[2]!,
  );
  const unsupported: ReturnType<typeof triangulateRecoverySceneTrack>[] = [
    triangulateRecoverySceneTrack(
      observations.slice(0, 1),
      fixture.poses,
      charts,
      fixture.input.policy,
      fixture.input.budget,
    ),
    triangulateRecoverySceneTrack(
      [observations[0]!, observations[0]!],
      fixture.poses,
      charts,
      fixture.input.policy,
      fixture.input.budget,
    ),
    triangulateRecoverySceneTrack(
      observations,
      unregistered,
      charts,
      fixture.input.policy,
      fixture.input.budget,
    ),
    triangulateRecoverySceneTrack(
      badPixel,
      fixture.poses,
      charts,
      fixture.input.policy,
      fixture.input.budget,
    ),
    triangulateRecoverySceneTrack(
      observations,
      coincident,
      charts,
      fixture.input.policy,
      fixture.input.budget,
    ),
  ];
  TestValidator.predicate(
    "unsupported point geometry never becomes a landmark",
    unsupported.every(
      (result: (typeof unsupported)[number]): boolean =>
        result.point === null && result.reasons.length > 0,
    ),
  );
  const behind: [number, number, number] = [
    fixture.points[48]![0],
    fixture.points[48]![1],
    -fixture.points[48]![2],
  ];
  const negative: ReturnType<typeof evaluateRecoveryScenePoint> =
    evaluateRecoveryScenePoint(
      behind,
      observations,
      fixture.poses,
      charts,
      fixture.input.policy,
    );
  TestValidator.predicate(
    "negative depth remains explicit",
    !negative.accepted &&
      negative.reasons.includes("nonpositive-depth") &&
      negative.maximumReprojectionPx === null,
  );
  const measured: IAutoMovieRecoveryMapObservation[] = observations.map(
    (observation: IAutoMovieRecoveryMapObservation, at: number): IAutoMovieRecoveryMapObservation => ({
      ...observation, pixel: [observation.pixel[0] + 0.1 * (at + 1), observation.pixel[1] - 0.2],
    }),
  );
  const measuredBytes: string = JSON.stringify(measured);
  const expectedNorms: number[] = measured.map((observation: IAutoMovieRecoveryMapObservation): number => {
    const pose: IAutoMovieRecoveryMapPose = fixture.poses[observation.viewIndex]!;
    const world: [number, number, number] = fixture.points[48]!;
    const matrix: readonly number[] = charts[observation.viewIndex]!.matrix;
    const x: number = pose.rotation[0]! * world[0] + pose.rotation[1]! * world[1] + pose.rotation[2]! * world[2] + pose.translation[0];
    const y: number = pose.rotation[3]! * world[0] + pose.rotation[4]! * world[1] + pose.rotation[5]! * world[2] + pose.translation[1];
    const z: number = pose.rotation[6]! * world[0] + pose.rotation[7]! * world[1] + pose.rotation[8]! * world[2] + pose.translation[2];
    return Math.hypot(matrix[0]! * (x / z) + matrix[1]! * (y / z) + matrix[2]! - observation.pixel[0], matrix[4]! * (y / z) + matrix[5]! - observation.pixel[1]);
  });
  const norms: number[] = [];
  let cost: number = 0, squared: number = 0;
  const observed: ReturnType<typeof evaluateRecoveryScenePoint> = evaluateRecoveryScenePoint(
    fixture.points[48]!, measured, fixture.poses, charts, fixture.input.policy, (norm: number): void => {
      norms.push(norm);
      cost += norm * (norm / (Math.hypot(1, norm / fixture.input.policy.lossScalePx) + 1));
      squared += norm * norm;
    },
  );
  const unobserved: ReturnType<typeof evaluateRecoveryScenePoint> = evaluateRecoveryScenePoint(fixture.points[48]!, measured, fixture.poses, charts, fixture.input.policy);
  const expectedCost: number = expectedNorms.reduce((sum: number, norm: number): number => sum + norm * (norm / (Math.hypot(1, norm / fixture.input.policy.lossScalePx) + 1)), 0);
  const expectedSquared: number = expectedNorms.reduce((sum: number, norm: number): number => sum + norm * norm, 0);
  TestValidator.predicate("raw residual reduction preserves order, diagnostics and original objective",
    observed.accepted && JSON.stringify(observed) === JSON.stringify(unobserved) && norms.length === 3 &&
    norms.every((value: number, at: number): boolean => nclose(value, expectedNorms[at]!, 1e-10)) &&
    nclose(cost, expectedCost, 1e-10) && nclose(squared, expectedSquared, 1e-10));
  let unavailableCalls: number = 0;
  evaluateRecoveryScenePoint(fixture.points[48]!, observations, unregistered, charts, fixture.input.policy, (): void => { unavailableCalls++; });
  let behindCalls: number = 0;
  evaluateRecoveryScenePoint(behind, observations, fixture.poses, charts, fixture.input.policy, (): void => { behindCalls++; });
  const partial: number[] = [];
  const badObserved: ReturnType<typeof evaluateRecoveryScenePoint> = evaluateRecoveryScenePoint(fixture.points[48]!, badPixel, fixture.poses, charts, fixture.input.policy, (norm: number): void => { partial.push(norm); });
  const rawNonfinite: IAutoMovieRecoveryMapObservation[] = measured.map((observation: IAutoMovieRecoveryMapObservation, at: number): IAutoMovieRecoveryMapObservation => at === 2 ? { ...observation, pixel: [Infinity, observation.pixel[1]] } : observation);
  let partialCost: number = 0;
  const invalid: ReturnType<typeof evaluateRecoveryScenePoint> = evaluateRecoveryScenePoint(fixture.points[48]!, rawNonfinite, fixture.poses, charts, fixture.input.policy, (norm: number): void => { partialCost += norm * (norm / (Math.hypot(1, norm / fixture.input.policy.lossScalePx) + 1)); });
  const discarded: number | null = invalid.accepted ? partialCost : null;
  const marker: Error = new Error("raw residual observer marker");
  let originalError: boolean = false;
  try { evaluateRecoveryScenePoint(fixture.points[48]!, observations, fixture.poses, charts, fixture.input.policy, (): void => { throw marker; }); } catch (error) { originalError = error === marker; }
  TestValidator.predicate("partial observations are not accepted costs or swallowed errors",
    unavailableCalls === 2 && behindCalls === 0 && !badObserved.accepted && partial.length === 3 &&
    partial[2]! > fixture.input.policy.maximumReprojectionErrorPx && discarded === null && !Number.isFinite(partialCost) && originalError &&
    JSON.stringify({ observations, poses: fixture.poses, points: fixture.points, charts }) === originalBytes && JSON.stringify(measured) === measuredBytes);
  const initialLandmarks: Parameters<typeof refineRecoveryCameraMap>[1][number][] = fixture.points.slice(0, 6).map(
    (point: [number, number, number], at: number): Parameters<typeof refineRecoveryCameraMap>[1][number] => ({
      id: at, point: [...point], observations: [0, 1, 2].map((viewIndex: number): IAutoMovieRecoveryMapObservation => {
        const featureIndex: number = fixture.identities[viewIndex]!.indexOf(at);
        const pixel: readonly [number, number] = fixture.features[viewIndex]!.points[featureIndex]!.point;
        return { viewIndex, featureIndex, pixel: [at === 5 && viewIndex === 2 ? Infinity : pixel[0], pixel[1]] };
      }),
    }),
  );
  const initialBytes: string = JSON.stringify({ initialLandmarks, poses: fixture.poses, charts });
  let initialError: string | null = null, initialTrials: number = 0;
  try {
    refineRecoveryCameraMap(fixture.poses, initialLandmarks, charts.map((chart: (typeof charts)[number]): number[] => chart.matrix), fixture.input.policy, fixture.input.budget,
      (): void => { initialTrials++; }, (): void => {}, {
        directionBudget: { maxIterations: 1000, maxEntries: 100000, maxWork: 10000000 },
        maxResidentLinearEntries: fixture.input.budget.maxResidentLinearEntries,
      });
  } catch (error) { initialError = error instanceof Error ? error.message : String(error); }
  TestValidator.predicate("actual map discards partial objective before initial feasibility refusal",
    initialError === "camera-feasible: actual feasible initial state required" && initialTrials === 0 &&
    initialLandmarks[5]!.observations[2]!.pixel[0] === Infinity &&
    JSON.stringify({ initialLandmarks, poses: fixture.poses, charts }) === initialBytes);
}
