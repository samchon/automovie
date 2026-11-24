import type { IAutoMovieRecoveryCameraMapInput } from "@automovie/interface";
import { estimateAutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoveryMapNumericalFixture } from "../../../internal/createRecoveryMapNumericalFixture";

/**
 * Public triad outcomes keep observation completion distinct from map
 * acceptance.
 *
 * Scenarios:
 *
 * 1. Three valid constant singleton images complete with zero features and
 *    explicit seed refusal, without inventing any pose or point.
 * 2. Snapshot metadata survives caller mutation, while pre-abort, checkpoint abort
 *    and observer exceptions return distinct no-value outcomes.
 * 3. Exhausted aggregate pixels refuse before observation.
 */
export function test_unit_recovery_observation_estimate_camera_map(): void {
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
      cancelledDuring.status === "cancelled" &&
      failed.status === "failed",
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
      refused.status === "refused" && !called,
    );
  }
}
