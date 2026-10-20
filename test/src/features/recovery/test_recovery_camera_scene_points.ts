import { TestValidator } from "@nestia/e2e";

import { admitRecoveryCameraScene } from "../../../../packages/recovery/src/internal/admitRecoveryCameraScene";
import { evaluateRecoveryScenePoint } from "../../../../packages/recovery/src/internal/evaluateRecoveryScenePoint";
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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls multiview original DLT and point qualification, checking prescribed coordinates, actual support indices, independent per-observation depth/pixel gates and refusal reasons.
 * @evidence contracts/testing.md#independent-expectations Prescribed world coordinates and scalar fixture pinhole projections define the point; negative depth follows an explicitly reflected world Z and coincident poses cannot supply depth. These are analytic conditions, not observed photograph truth.
 * @evidence contracts/testing.md#distinguishing-cases Covers two and three observations without either seed, actual global indices, duplicate and absent camera support, coincident rays, behind-camera geometry, inconsistent pixels and unchanged input ownership.
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
}
