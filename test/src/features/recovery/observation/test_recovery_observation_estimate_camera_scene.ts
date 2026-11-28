import type { IAutoMovieRecoveryCameraSceneInput } from "@automovie/interface";
import { AutoMovieRecoveryObservation } from "@automovie/recovery";
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
 * 3. Malformed scene identity, later views and scene limits refuse before
 *    observation.
 * 4. Three views and exact positive low limits retain completed seed refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes completed seed refusal, malformed admission, detached metadata and checkpoint outcomes.
 * @evidence contracts/development/testing.md#behavioral-verification Runs five-view and three-view singleton scenes, checks metadata and outcomes, and submits malformed fourth-view data, shape and work limits before observation.
 * @evidence contracts/development/testing.md#independent-expectations Singleton views consume one pixel each and supply no feature tracks. The three-view boundary case needs exactly three aggregate and two seed pixels, with source and registration lists in the supplied order.
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
  const result: ReturnType<
    typeof AutoMovieRecoveryObservation.estimateCameraScene
  > = AutoMovieRecoveryObservation.estimateCameraScene(input, {
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
  const cancelled: ReturnType<
    typeof AutoMovieRecoveryObservation.estimateCameraScene
  >[] = [
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
  const failed: ReturnType<
    typeof AutoMovieRecoveryObservation.estimateCameraScene
  > = AutoMovieRecoveryObservation.estimateCameraScene(make(), {
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
  const malformed: [
    label: string,
    mutate: (value: IAutoMovieRecoveryCameraSceneInput) => void,
  ][] = [
    ["unknown schema", (value) => Object.assign(value, { schema: "other" })],
    ["two views", (value) => (value.views = value.views.slice(0, 2))],
    ["extra view beyond cap", (value) => (value.budget.maxViews = 4)],
    ["aggregate pixel exhaustion", (value) => (value.budget.maxPixels = 4)],
    ["seed pixel exhaustion", (value) => (value.seedBudget.maxPixels = 1)],
    [
      "duplicate fourth view ID",
      (value) => (value.views[3]!.id = value.views[1]!.id),
    ],
    [
      "fourth view missing bytes",
      (value) => (value.views[3]!.rgb8 = new Uint8Array(2)),
    ],
    [
      "fourth view invalid hash",
      (value) => (value.views[3]!.sourceSha256 = "broken"),
    ],
    [
      "fourth view invalid chart",
      (value) => (value.views[3]!.camera.focalPx[0] = 0),
    ],
    ["nonfinite view cap", (value) => (value.budget.maxViews = NaN)],
    [
      "unbounded triangulations",
      (value) => (value.budget.maxTriangulations = Infinity),
    ],
    ["nonfinite linear work", (value) => (value.budget.maxLinearWork = NaN)],
    ["fractional joint fit cap", (value) => (value.budget.maxJointFits = 1.25)],
    [
      "unsafe resident entries",
      (value) => (value.budget.maxResidentLinearEntries = 2 ** 53),
    ],
    [
      "invalid inherited policy",
      (value) => (value.policy.maximumDltNullRatio = 1),
    ],
  ];
  for (const [label, mutate] of malformed) {
    const variant: IAutoMovieRecoveryCameraSceneInput = make();
    mutate(variant);
    let observed: boolean = false;
    const outcome: ReturnType<
      typeof AutoMovieRecoveryObservation.estimateCameraScene
    > = AutoMovieRecoveryObservation.estimateCameraScene(variant, {
      onProgress: (): void => {
        observed = true;
      },
    });
    TestValidator.predicate(
      `${label} refuses before scene observation`,
      outcome.status === "refused" && !("value" in outcome) && !observed,
    );
  }
  const tiny: IAutoMovieRecoveryCameraSceneInput = make();
  tiny.views = tiny.views.slice(0, 3);
  Object.assign(tiny.budget, {
    maxViews: 3,
    maxPixels: 3,
    maxDescriptorPairs: 1,
    maxTracks: 1,
    maxObservations: 1,
    maxResectionTrials: 1,
    minimumResectionTrials: 1,
    maxLocalRefinements: 1,
    maxRefinementIterations: 1,
    maxLinearEntries: 1,
    maxSingularSweeps: 1,
    maxCameraAttempts: 1,
    maxTotalResectionTrials: 1,
    maxTriangulations: 1,
    maxJointFits: 1,
    maxLinearWork: 1,
    maxResidentLinearEntries: 1,
  });
  tiny.seedBudget.maxPixels = 2;
  const sparse = AutoMovieRecoveryObservation.estimateCameraScene(tiny);
  TestValidator.predicate(
    "three images and positive low scene limits retain seed refusal",
    sparse.status === "partial" &&
      sparse.value.stopReason === "seed-refused" &&
      sparse.value.poses.length === 3 &&
      sparse.value.sources.map((source) => source.id).join(",") ===
        tiny.views.map((view) => view.id).join(",") &&
      sparse.value.registration.length === 3 &&
      sparse.value.unregisteredViews.join(",") === "0,1,2" &&
      sparse.value.work.cameraAttempts === 0,
  );
}
