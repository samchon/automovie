import { TestValidator } from "@nestia/e2e";

import { admitRecoveryCameraScene } from "../../../../packages/recovery/src/internal/admitRecoveryCameraScene";
import { createRecoveryCameraScene } from "../../../../packages/recovery/src/internal/createRecoveryCameraScene";
import { createRecoverySceneNumericalFixture } from "../internal/createRecoverySceneNumericalFixture";
import { nclose } from "../internal/nclose";

/**
 * New registered-view landmarks unlock cameras invisible to the original seed.
 *
 * Scenarios:
 * 1. Five prescribed cameras and three nonplanar point groups require seed -> third -> new points -> fourth -> new points -> fifth registration.
 * 2. All camera/point coordinates, baseline ratios and actual supporting pairs remain in one gauge despite points absent from both original seed views.
 * 3. Caller numerical observations remain unchanged, and common joint population/coverage and aggregate consumed work are explicit.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual global linking, seed qualification, original triangulation, robust resection and general-width joint refinement, asserting all five cameras and all 72 prescribed points. A seed-only-landmark implementation cannot register the final two views.
 * @evidence contracts/testing.md#independent-expectations Prescribed trigonometric poses, scalar pinhole projection and a visibility chain define expected geometry. Artificial one-channel descriptors isolate numerical orchestration and do not prove RGB detection or photographic correspondence accuracy.
 * @evidence contracts/testing.md#distinguishing-cases Includes two/three retained observations, new points without seed visibility, missing camera measurements, nonunit later baselines, multiple incremental revisions and detached input ownership. Refusal/rollback, general linear equivalence and public extraction are separate cases.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_camera_scene_pipeline entry owns resident arrays only and starts no filesystem host, process, compiler, installation, browser or GPU.
 */
export function test_recovery_camera_scene_pipeline(): void {
  const fixture: ReturnType<typeof createRecoverySceneNumericalFixture> =
    createRecoverySceneNumericalFixture();
  const before: string = JSON.stringify({
    features: fixture.features,
    pairs: fixture.pairs,
    poses: fixture.poses,
  });
  const result: ReturnType<typeof createRecoveryCameraScene> =
    createRecoveryCameraScene(
      fixture.input,
      fixture.features,
      admitRecoveryCameraScene(fixture.input),
      fixture.pairs,
      fixture.comparisons,
      (): void => {},
    );
  TestValidator.predicate(
    "visibility chain completes one qualified component",
    result.status === "accepted-sparse-component" &&
      result.stopReason === "all-registered" &&
      result.registeredViews.length === 5 &&
      result.unregisteredViews.length === 0 &&
      result.landmarks.length === 72 &&
      result.revision === 3,
  );
  TestValidator.predicate(
    "registration follows only existing-map support",
    result.attempts
      .map(
        (attempt: (typeof result.attempts)[number]): number =>
          attempt.viewIndex,
      )
      .join(",") === "2,3,4" &&
      result.attempts.every(
        (attempt: (typeof result.attempts)[number]): boolean =>
          attempt.outcome === "accepted" && attempt.candidates === 24,
      ),
  );
  TestValidator.predicate(
    "all prescribed cameras share the seed gauge",
    result.poses.every(
      (pose: (typeof result.poses)[number], at: number): boolean =>
        pose !== null &&
        pose.rotation.every((value: number, axis: number): boolean =>
          nclose(value, fixture.poses[at]!.rotation[axis]!, 1e-5),
        ) &&
        pose.translation.every((value: number, axis: number): boolean =>
          nclose(value, fixture.poses[at]!.translation[axis]!, 1e-5),
        ),
    ),
  );
  for (const landmark of result.landmarks) {
    const first: (typeof landmark.observations)[number] =
      landmark.observations[0]!;
    const identity: number =
      fixture.identities[first.viewIndex]![first.featureIndex]!;
    TestValidator.predicate(
      "prescribed point with unchanged material-index seam",
      landmark.point.every((value: number, axis: number): boolean =>
        nclose(value, fixture.points[identity]![axis]!, 1e-4),
      ) &&
        landmark.observations.every(
          (observation: (typeof landmark.observations)[number]): boolean =>
            fixture.identities[observation.viewIndex]![
              observation.featureIndex
            ] === identity,
        ),
    );
    TestValidator.predicate(
      "support comes from actual retained images",
      landmark.supportingViews.every((view: number): boolean =>
        landmark.observations.some(
          (observation: (typeof landmark.observations)[number]): boolean =>
            observation.viewIndex === view,
        ),
      ) && landmark.acuteParallaxDegrees >= 1,
    );
  }
  TestValidator.predicate(
    "later new points do not require seed visibility",
    result.landmarks.some(
      (landmark: (typeof result.landmarks)[number]): boolean =>
        landmark.observations.every(
          (observation: (typeof landmark.observations)[number]): boolean =>
            observation.viewIndex >= 2,
        ),
    ),
  );
  TestValidator.predicate(
    "population and unchanged input ownership remain explicit",
    result.joint?.observationCount === 216 &&
      result.work.cameraAttempts === 3 &&
      result.work.jointFits >= 4 &&
      result.work.triangulations >= 72 &&
      before ===
        JSON.stringify({
          features: fixture.features,
          pairs: fixture.pairs,
          poses: fixture.poses,
        }),
  );
}
