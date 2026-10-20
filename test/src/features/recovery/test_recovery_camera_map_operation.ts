import type { IAutoMovieRecoveryCameraMapInput } from "@automovie/interface/recovery";
import { estimateAutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoveryMapNumericalFixture } from "../internal/createRecoveryMapNumericalFixture";

/**
 * Public triad outcomes keep observation completion distinct from map acceptance.
 *
 * Scenarios:
 * 1. Three valid constant singleton images complete with zero features and explicit seed refusal, without inventing any pose or point.
 * 2. Snapshot metadata survives caller mutation, while pre-abort, checkpoint abort and observer exceptions return distinct no-value outcomes.
 * 3. A missing/duplicate third view, extra policy/option keys, invalid numeric thresholds and exhausted aggregate pixels refuse before observation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the exported resident API and observes actual empty-image computation, three source identities, no invented geometry, detached metadata, terminal states and closed preallocation admission.
 * @evidence contracts/testing.md#independent-expectations Constant singleton images cannot form gradient windows or two-neighbour descriptors, so geometry is necessarily absent. The public contract fixes exactly three unique images, borrowed RGB length and explicit policy limits; cancellation or failed callbacks cannot transfer an artifact.
 * @evidence contracts/testing.md#distinguishing-cases Covers zero observations, completed refusal, all three null poses, no landmarks, caller metadata lifetime, pre-start and checkpoint cancellation, callback failure, missing/duplicate sources, closed policy/options, invalid finite ranges and aggregate pixel overflow. Positive numerical geometry and host filesystem effects have separate owners.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_camera_map_operation entry creates resident arrays, records and AbortControllers only; it starts no filesystem, subprocess, installation, native compiler, browser or GPU and replaces no foreign implementation.
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
    estimateAutoMovieRecoveryCameraMap(make(), { signal: before.signal });
  const cancelledDuring: ReturnType<typeof estimateAutoMovieRecoveryCameraMap> =
    estimateAutoMovieRecoveryCameraMap(make(), {
      signal: during.signal,
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
      value.views.pop();
    },
    (value: IAutoMovieRecoveryCameraMapInput): void => {
      value.views[2]!.id = value.views[0]!.id;
    },
    (value: IAutoMovieRecoveryCameraMapInput): void => {
      Object.defineProperty(value.policy, "extra", { value: 1 });
    },
    (value: IAutoMovieRecoveryCameraMapInput): void => {
      value.policy.minimumPointParallaxDegrees = 90;
    },
    (value: IAutoMovieRecoveryCameraMapInput): void => {
      value.policy.maximumDltNullRatio = 1;
    },
    (value: IAutoMovieRecoveryCameraMapInput): void => {
      value.budget.maxPixels = 2;
    },
    (value: IAutoMovieRecoveryCameraMapInput): void => {
      value.views[2]!.rgb8 = new Uint8Array(2);
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
      "malformed map refuses before observation",
      refused.status === "refused" && !("value" in refused) && !called,
    );
  }
  const unknown: object = { [Symbol("unknown")]: true };
  const invalidOption: ReturnType<typeof estimateAutoMovieRecoveryCameraMap> =
    estimateAutoMovieRecoveryCameraMap(make(), unknown);
  TestValidator.predicate(
    "unknown symbol option refuses",
    invalidOption.status === "refused" && !("value" in invalidOption),
  );
}
