import type { IAutoMovieRecoveryCameraMapInput } from "@automovie/interface";
import { estimateAutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoveryMapNumericalFixture } from "../internal/createRecoveryMapNumericalFixture";

/**
 * Public triad outcomes keep observation completion distinct from map acceptance.
 *
 * Scenarios:
 * 1. Three valid constant singleton images complete with zero features and explicit seed refusal, without inventing any pose or point.
 * 2. Snapshot metadata survives caller mutation, while pre-abort, checkpoint abort and observer exceptions return distinct no-value outcomes.
 * 3. Exhausted aggregate pixels refuse before observation.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the exported resident API and observes actual empty-image computation, three source identities, no invented geometry, detached metadata, terminal states and the preallocation pixel budget.
 * @evidence contracts/development/testing.md#independent-expectations Constant singleton images cannot form gradient windows or two-neighbour descriptors, so geometry is necessarily absent. The caller's aggregate pixel budget bounds the three images; cancellation or failed callbacks cannot transfer an artifact.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers zero observations, completed refusal, all three null poses, no landmarks, caller metadata lifetime, pre-start and checkpoint cancellation, callback failure and aggregate pixel overflow. Positive numerical geometry and host filesystem effects have separate owners.
 * @evidence contracts/development/testing.md#execution-ownership The portable test_recovery_camera_map_operation entry creates resident arrays, records and AbortControllers only; it starts no filesystem, subprocess, installation, native compiler, browser or GPU and replaces no foreign implementation.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Three valid constant singleton images complete with zero features and explicit seed refusal, without inventing any pose or point.).
 */
export function test_recovery_camera_map_operation(): void {
  const make: () => IAutoMovieRecoveryCameraMapInput =
    (): IAutoMovieRecoveryCameraMapInput => {
      const input: IAutoMovieRecoveryCameraMapInput =
        createRecoveryMapNumericalFixture().input;
      input.views = input.views.map(
        (view: (typeof input.views)[number]): typeof view => ({
          ...view,
          width: 1,
          height: 1,
          rgb8: new Uint8Array(3),
        }),
      );
      return input;
    };
  const input: IAutoMovieRecoveryCameraMapInput = make();
  const result: ReturnType<typeof estimateAutoMovieRecoveryCameraMap> =
    estimateAutoMovieRecoveryCameraMap(input, {
      onProgress: (): void => {
        input.objectId = "changed";
        input.policy.maximumReprojectionErrorPx = 99;
        input.views[2]!.camera.focalPx[0] = 123;
      },
    });
  TestValidator.predicate(
    "completed empty triad retains measured seed refusal and detached metadata",
    result.status === "partial" &&
      "value" in result &&
      result.value.status === "refused" &&
      result.value.poses.length === 3 &&
      result.value.poses.every(
        (pose: (typeof result.value.poses)[number]): boolean => pose === null,
      ) &&
      result.value.landmarks.length === 0 &&
      result.value.featureCounts.every(
        (count: number): boolean => count === 0,
      ) &&
      result.value.sources.length === 3 &&
      result.value.sources[2]!.camera.focalPx[0] === 760 &&
      result.value.objectId === "independent-analytic-triad" &&
      result.value.policy.maximumReprojectionErrorPx === 2,
  );
  const before: AbortController = new AbortController();
  before.abort();
  const during: AbortController = new AbortController();
  const cancelledBefore: ReturnType<typeof estimateAutoMovieRecoveryCameraMap> =
    estimateAutoMovieRecoveryCameraMap(make(), {
      cancelled: (): boolean => before.signal.aborted,
    });
  const cancelledDuring: ReturnType<typeof estimateAutoMovieRecoveryCameraMap> =
    estimateAutoMovieRecoveryCameraMap(make(), {
      cancelled: (): boolean => during.signal.aborted,
      onProgress: (): void => during.abort(),
    });
  const failed: ReturnType<typeof estimateAutoMovieRecoveryCameraMap> =
    estimateAutoMovieRecoveryCameraMap(make(), {
      onProgress: (): void => {
        throw new Error("owned observer failure");
      },
    });
  TestValidator.predicate(
    "cancellation and callback failure transfer no value",
    cancelledBefore.status === "cancelled" &&
      !("value" in cancelledBefore) &&
      cancelledDuring.status === "cancelled" &&
      !("value" in cancelledDuring) &&
      failed.status === "failed" &&
      !("value" in failed),
  );
  const mutations: ((value: IAutoMovieRecoveryCameraMapInput) => void)[] = [
    (value: IAutoMovieRecoveryCameraMapInput): void => {
      value.budget.maxPixels = 2;
    },
  ];
  for (const mutate of mutations) {
    const value: IAutoMovieRecoveryCameraMapInput = make();
    mutate(value);
    let called: boolean = false;
    const refused: ReturnType<typeof estimateAutoMovieRecoveryCameraMap> =
      estimateAutoMovieRecoveryCameraMap(value, {
        onProgress: (): void => {
          called = true;
        },
      });
    TestValidator.predicate(
      "over-budget map refuses before observation",
      refused.status === "refused" && !("value" in refused) && !called,
    );
  }
}

