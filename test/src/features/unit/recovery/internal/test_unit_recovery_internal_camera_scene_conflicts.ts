import {
  admitRecoveryCameraScene,
  createRecoveryCameraScene,
  linkRecoveryCameraTracks,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoverySceneNumericalFixture } from "../../../internal/createRecoverySceneNumericalFixture";

/**
 * A late image's transitive conflict is withheld before initial seed estimation.
 *
 * Scenarios:
 * 1. One reciprocal index link between the seed and last image joins two otherwise distinct material-index seam tracks, creating duplicate observations in a middle image.
 * 2. The whole global component is excluded from seed geometry and final points; other qualified tracks retain a complete component.
 */
export function test_unit_recovery_internal_camera_scene_conflicts(): void {
  const fixture: ReturnType<typeof createRecoverySceneNumericalFixture> =
    createRecoverySceneNumericalFixture();
  const pair: (typeof fixture.pairs)[number] = fixture.pairs.find(
    (item: (typeof fixture.pairs)[number]): boolean =>
      item.first === 0 && item.second === 4,
  )!;
  pair.forward.push({
    firstIndex: 0,
    secondIndex: 0,
    first: [...fixture.features[0]!.points[0]!.point],
    second: [...fixture.features[4]!.points[0]!.point],
    squaredDescriptorDistance: 0,
    descriptorDistanceRatio: 0,
  });
  pair.reverse.push({
    firstIndex: 0,
    secondIndex: 0,
    first: [...fixture.features[4]!.points[0]!.point],
    second: [...fixture.features[0]!.points[0]!.point],
    squaredDescriptorDistance: 0,
    descriptorDistanceRatio: 0,
  });
  const linked: ReturnType<typeof linkRecoveryCameraTracks> =
    linkRecoveryCameraTracks(
      fixture.features,
      fixture.pairs,
      fixture.input.budget,
    );
  TestValidator.predicate(
    "late transitivity creates one global conflict",
    linked.conflictingComponents === 1 && linked.tracks.length === 70,
  );
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
    "global identity policy precedes seed geometry",
    result.seed.matches.length === 23 &&
      result.conflictingTracks === 1 &&
      result.status === "accepted-sparse-component" &&
      result.stopReason === "all-registered" &&
      result.landmarks.length === 70,
  );
  TestValidator.predicate(
    "neither merged identity leaks into accepted points",
    result.landmarks.every(
      (landmark: (typeof result.landmarks)[number]): boolean =>
        landmark.observations.every(
          (observation: (typeof landmark.observations)[number]): boolean => {
            const identity: number =
              fixture.identities[observation.viewIndex]![
                observation.featureIndex
              ]!;
            return identity !== 0 && identity !== 48;
          },
        ),
    ),
  );
}
