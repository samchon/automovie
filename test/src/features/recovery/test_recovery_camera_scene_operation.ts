import type { IAutoMovieRecoveryCameraSceneInput } from "@automovie/interface/recovery";
import { estimateAutoMovieRecoveryCameraScene } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoverySceneNumericalFixture } from "../internal/createRecoverySceneNumericalFixture";

/**
 * The public image-set operation separates completion, qualification and effects.
 *
 * Scenarios:
 * 1. Five actual singleton RGB inputs complete extraction and global linkage with an explicit seed refusal and detached source/policy metadata.
 * 2. Cancellation before/at a checkpoint and observer failure return no value, including an observer message resembling a numerical refusal.
 * 3. Missing/extra fields, duplicate/fewer/over-budget views, malformed RGB/calibration and unsafe aggregate limits refuse before observation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public resident scene operation on actual RGB bytes and checks source-order null poses, every registration record, zero work, detached inputs and no-value terminal states.
 * @evidence contracts/testing.md#independent-expectations A singleton constant raster cannot supply a supported descriptor or camera; input preservation and explicit schemas define refusal/cancellation effects without invoking numerical fitting as an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Covers five versus fewer/duplicate/over-limit views, zero features, observer mutation, spoofed numerical error messages, pre/during cancellation, unknown keys, bad pixel length, calibration and proposal ceilings. Positive geometry is the separate numerical visibility-chain seam, not a claim about photo extraction.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_camera_scene_operation entry uses the public resident import with finite arrays, no filesystem/process/native/compiler/browser/GPU or installed consumer.
 */
export function test_recovery_camera_scene_operation(): void {
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
  const result: ReturnType<typeof estimateAutoMovieRecoveryCameraScene> =
    estimateAutoMovieRecoveryCameraScene(input, {
      onProgress: (): void => {
        input.objectId = "mutated";
        input.policy.maximumReprojectionErrorPx = 99;
        input.views[4]!.camera.focalPx[0] = 1;
      },
    });
  TestValidator.predicate(
    "empty extraction is completed evidence with detached metadata",
    result.status === "partial" &&
      "value" in result &&
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
      !Object.hasOwn(result.value, "refusedSeedJoint") &&
      result.value.objectId === "analytic-visibility-chain" &&
      result.value.policy.maximumReprojectionErrorPx === 2 &&
      result.value.sources[4]!.camera.focalPx[0] === 820,
  );
  const before: AbortController = new AbortController();
  before.abort();
  const during: AbortController = new AbortController();
  const cancelled: ReturnType<typeof estimateAutoMovieRecoveryCameraScene>[] = [
    estimateAutoMovieRecoveryCameraScene(make(), { signal: before.signal }),
    estimateAutoMovieRecoveryCameraScene(make(), {
      signal: during.signal,
      onProgress: (): void => during.abort(),
    }),
  ];
  TestValidator.predicate(
    "cancellation publishes no partial value",
    cancelled.every(
      (outcome: (typeof cancelled)[number]): boolean =>
        outcome.status === "cancelled" && !("value" in outcome),
    ),
  );
  const failed: ReturnType<typeof estimateAutoMovieRecoveryCameraScene> =
    estimateAutoMovieRecoveryCameraScene(make(), {
      onProgress: (): void => {
        throw new Error(
          "camera-map: observer is not a numerical candidate refusal",
        );
      },
    });
  TestValidator.predicate(
    "observer failure cannot be swallowed as geometry",
    failed.status === "failed" && !("value" in failed),
  );
  const variants: IAutoMovieRecoveryCameraSceneInput[] = [];
  let invalid: IAutoMovieRecoveryCameraSceneInput = make();
  invalid.views = invalid.views.slice(0, 2);
  variants.push(invalid);
  invalid = make();
  invalid.views[4]!.id = invalid.views[0]!.id;
  variants.push(invalid);
  invalid = make();
  invalid.budget.maxViews = 4;
  variants.push(invalid);
  invalid = make();
  invalid.views[4]!.rgb8 = new Uint8Array(4);
  variants.push(invalid);
  invalid = make();
  invalid.views[4]!.camera.focalPx[0] = 0;
  variants.push(invalid);
  invalid = make();
  invalid.budget.maxPixels = 4;
  variants.push(invalid);
  invalid = make();
  invalid.budget.maxTotalResectionTrials = 1;
  variants.push(invalid);
  invalid = make();
  invalid.budget.maxLinearWork = Infinity;
  variants.push(invalid);
  invalid = make();
  Object.assign(invalid, { extra: true });
  variants.push(invalid);
  for (const variant of variants) {
    const outcome: ReturnType<typeof estimateAutoMovieRecoveryCameraScene> =
      estimateAutoMovieRecoveryCameraScene(variant);
    TestValidator.predicate(
      "closed unsupported input refuses without a value",
      outcome.status === "refused" && !("value" in outcome),
    );
  }
}
