import type { IAutoMovieRecoveryCameraSceneInput } from "@automovie/interface";
import {
  AutoMovieRecoveryObservation,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoverySceneNumericalFixture } from "../../internal/createRecoverySceneNumericalFixture";

/**
 * The public image-set operation separates completion, qualification and
 * effects.
 *
 * Scenarios:
 *
 * 1. Five actual singleton RGB inputs complete extraction and global linkage with
 *    an explicit seed refusal and detached source/policy metadata.
 * 2. Cancellation before/at a checkpoint and observer failure return no value,
 *    including an observer message resembling a numerical refusal.
 * 3. Over-budget views and aggregate pixels refuse before observation.
 */
export function test_recovery_observation_estimate_camera_scene(): void {
  const base: IAutoMovieRecoveryCameraSceneInput =
    createRecoverySceneNumericalFixture().input;
  const make: () => IAutoMovieRecoveryCameraSceneInput =
    (): IAutoMovieRecoveryCameraSceneInput => ({
      ...base,
      seedPolicy: { ...base.seedPolicy },
      seedBudget: { ...base.seedBudget },
      policy: { ...base.policy },
      budget: { ...base.budget },
      views: base.views.map(
        (view: (typeof base.views)[number]): typeof view => ({
          ...view,
          width: 1,
          height: 1,
          rgb8: new Uint8Array(3),
          camera: {
            ...view.camera,
            focalPx: [...view.camera.focalPx],
            principalPointPx: [...view.camera.principalPointPx],
          },
        }),
      ),
    });
  const input: IAutoMovieRecoveryCameraSceneInput = make();
  const result: ReturnType<typeof AutoMovieRecoveryObservation.estimateCameraScene> =
    AutoMovieRecoveryObservation.estimateCameraScene(input, {
      onProgress: (): void => {
        input.objectId = "mutated";
        input.policy.maximumReprojectionErrorPx = 99;
        input.views[4]!.camera.focalPx[0] = 1;
      },
    });
  TestValidator.predicate(
    "empty extraction is completed evidence with detached metadata",
    result.status === "partial" &&
      result.value.status === "refused" &&
      result.value.sources.length === 5 &&
      result.value.poses.every(
        (pose: (typeof result.value.poses)[number]): boolean => pose === null,
      ) &&
      result.value.registration.length === 5 &&
      result.value.registration.every(
        (row: (typeof result.value.registration)[number]): boolean =>
          row.status === "not-attempted",
      ) &&
      result.value.featureCounts.every(
        (count: number): boolean => count === 0,
      ) &&
      result.value.work.jointFits === 0 &&
      result.value.refusedSeedJoint === undefined &&
      result.value.objectId === "analytic-visibility-chain" &&
      result.value.policy.maximumReprojectionErrorPx === 2 &&
      result.value.sources[4]!.camera.focalPx[0] === 820,
  );
  const before: AbortController = new AbortController();
  before.abort();
  const during: AbortController = new AbortController();
  const cancelled: ReturnType<typeof AutoMovieRecoveryObservation.estimateCameraScene>[] = [
    AutoMovieRecoveryObservation.estimateCameraScene(make(), {
      cancelled: (): boolean => before.signal.aborted,
    }),
    AutoMovieRecoveryObservation.estimateCameraScene(make(), {
      cancelled: (): boolean => during.signal.aborted,
      onProgress: (): void => during.abort(),
    }),
  ];
  TestValidator.predicate(
    "cancellation publishes no partial value",
    cancelled.every(
      (outcome: (typeof cancelled)[number]): boolean =>
        outcome.status === "cancelled",
    ),
  );
  const failed: ReturnType<typeof AutoMovieRecoveryObservation.estimateCameraScene> =
    AutoMovieRecoveryObservation.estimateCameraScene(make(), {
      onProgress: (): void => {
        throw new Error(
          "camera-map: observer is not a numerical candidate refusal",
        );
      },
    });
  TestValidator.predicate(
    "observer failure cannot be swallowed as geometry",
    failed.status === "failed",
  );
  const variants: IAutoMovieRecoveryCameraSceneInput[] = [];
  let overBudget: IAutoMovieRecoveryCameraSceneInput = make();
  overBudget.budget.maxViews = 4;
  variants.push(overBudget);
  overBudget = make();
  overBudget.budget.maxPixels = 4;
  variants.push(overBudget);
  for (const variant of variants) {
    const outcome: ReturnType<typeof AutoMovieRecoveryObservation.estimateCameraScene> =
      AutoMovieRecoveryObservation.estimateCameraScene(variant);
    TestValidator.predicate(
      "over-budget view set refuses without a value",
      outcome.status === "refused",
    );
  }
}
