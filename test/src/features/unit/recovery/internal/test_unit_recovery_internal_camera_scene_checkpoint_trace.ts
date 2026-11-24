import type {
  IAutoMovieRecoveryMapLandmark,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoverySceneCheckpointTrace,
  IAutoMovieRecoverySceneWork,
} from "@automovie/interface";
import {
  admitRecoveryCameraScene,
  completeRecoverySceneCheckpoint,
  evaluateRecoveryScenePoint,
  linkRecoveryCameraTracks,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoverySceneNumericalFixture } from "../../../internal/createRecoverySceneNumericalFixture";
import { nclose } from "../../../internal/nclose";

/**
 * Complete detached joint snapshots preserve ordinary fitting and ownership.
 *
 * Scenarios:
 * 1. An analytic seed and perturbed third camera produce complete paired states, including newly triangulated points and observations, even when a one-step fit is refused.
 * 2. An observer mutates every owned state without changing results, work counters, input geometry or previously retained snapshots.
 * 3. A numerical-looking observer error propagates unchanged and cannot become a geometric refusal or accepted checkpoint.
 */
export function test_unit_recovery_internal_camera_scene_checkpoint_trace(): void {
  const fixture: ReturnType<typeof createRecoverySceneNumericalFixture> =
    createRecoverySceneNumericalFixture();
  const charts: ReturnType<typeof admitRecoveryCameraScene> =
    admitRecoveryCameraScene(fixture.input);
  charts[4] = charts[2]!;
  const tracks: ReturnType<typeof linkRecoveryCameraTracks>["tracks"] =
    linkRecoveryCameraTracks(
      fixture.features,
      fixture.pairs,
      fixture.input.budget,
    ).tracks.map(
      (
        track: ReturnType<typeof linkRecoveryCameraTracks>["tracks"][number],
      ): ReturnType<typeof linkRecoveryCameraTracks>["tracks"][number] => ({
        id: track.id,
        observations: track.observations
          .filter(
            (observation: (typeof track.observations)[number]): boolean =>
              observation.viewIndex < 3,
          )
          .map(
            (
              observation: (typeof track.observations)[number],
            ): (typeof track.observations)[number] => ({
              ...observation,
              viewIndex:
                observation.viewIndex === 2 ? 4 : observation.viewIndex,
            }),
          ),
      }),
    );
  const initial: IAutoMovieRecoveryMapLandmark[] = tracks.flatMap(
    (track: (typeof tracks)[number]): IAutoMovieRecoveryMapLandmark[] => {
      const observations: typeof track.observations = track.observations.filter(
        (observation: (typeof track.observations)[number]): boolean =>
          observation.viewIndex < 2,
      );
      if (observations.length !== 2) return [];
      const first: (typeof observations)[number] = observations[0]!;
      const identity: number =
        fixture.identities[first.viewIndex]![first.featureIndex]!;
      return [
        { id: track.id, point: [...fixture.points[identity]!], observations },
      ];
    },
  );
  const poses: (IAutoMovieRecoveryMapPose | null)[] = fixture.poses.map(
    (
      pose: IAutoMovieRecoveryMapPose,
      at: number,
    ): IAutoMovieRecoveryMapPose | null =>
      at >= 2 ? null : structuredClone(pose),
  );
  poses[4] = structuredClone(fixture.poses[2]!);
  poses[4]!.translation[0] += 0.02;
  const inputBefore: string = JSON.stringify({ initial, poses, tracks });
  const budget: typeof fixture.input.budget = {
    ...fixture.input.budget,
    maxRefinementIterations: 1,
  };
  const work: () => IAutoMovieRecoverySceneWork =
    (): IAutoMovieRecoverySceneWork => ({
      cameraAttempts: 0,
      resectionTrials: 0,
      triangulations: 0,
      triangulationRefusals: 0,
      jointFits: 0,
      jointIterationAttempts: 0,
      linearWork: 0,
    });
  const ordinaryWork: IAutoMovieRecoverySceneWork = work();
  const ordinary: ReturnType<typeof completeRecoverySceneCheckpoint> =
    completeRecoverySceneCheckpoint(
      poses,
      initial,
      tracks,
      charts,
      fixture.input.policy,
      budget,
      ordinaryWork,
      (): void => {},
    );
  const observedWork: IAutoMovieRecoverySceneWork = work();
  const events: IAutoMovieRecoverySceneCheckpointTrace[] = [];
  const observed: ReturnType<typeof completeRecoverySceneCheckpoint> =
    completeRecoverySceneCheckpoint(
      poses,
      initial,
      tracks,
      charts,
      fixture.input.policy,
      budget,
      observedWork,
      (): void => {},
      (): void => {},
      (event: IAutoMovieRecoverySceneCheckpointTrace): void => {
        events.push(structuredClone(event));
        event.activeViews.length = 0;
        event.poses[1]!.translation[0] = 1e10;
        event.landmarks[0]!.point[0] = -1e10;
        event.landmarks[0]!.observations[0]!.pixel[0] = 1e10;
        event.landmarks.length = 0;
        if (event.joint) event.joint.finalCost = 1e10;
      },
    );
  const equivalent: (first: unknown, second: unknown) => boolean = (
    first: unknown,
    second: unknown,
  ): boolean => {
    if (typeof first === "number" && typeof second === "number")
      return nclose(first, second, 0);
    if (
      first === null ||
      second === null ||
      typeof first !== "object" ||
      typeof second !== "object"
    )
      return first === second;
    const a: Record<string, unknown> = first as Record<string, unknown>;
    const b: Record<string, unknown> = second as Record<string, unknown>;
    const keys: string[] = Object.keys(a);
    return (
      keys.length === Object.keys(b).length &&
      keys.every(
        (key: string): boolean =>
          Object.hasOwn(b, key) && equivalent(a[key], b[key]),
      )
    );
  };
  TestValidator.predicate(
    "observer preserves every result and consumed work",
    equivalent(ordinary, observed) && equivalent(ordinaryWork, observedWork),
  );
  TestValidator.predicate(
    "observer cannot alter any input",
    inputBefore === JSON.stringify({ initial, poses, tracks }),
  );
  TestValidator.predicate(
    "nonconverged snapshots do not qualify a checkpoint",
    !observed.accepted &&
      observed.reasons.includes("joint-not-converged") &&
      observed.poses.length === 0 &&
      observed.landmarks.length === 0 &&
      observed.joint?.iterations === 1,
  );
  TestValidator.predicate(
    "one actual fit has both complete boundaries",
    events.length === 2 &&
      events[0]!.phase === "before-joint" &&
      events[1]!.phase === "after-joint" &&
      events.every(
        (event: IAutoMovieRecoverySceneCheckpointTrace): boolean =>
          event.pass === 0 &&
          event.activeViews.join(",") === "0,1,4" &&
          event.poses.length === 3,
      ) &&
      events[0]!.joint === null &&
      events[1]!.joint !== null,
  );
  const before: IAutoMovieRecoverySceneCheckpointTrace = events[0]!;
  const after: IAutoMovieRecoverySceneCheckpointTrace = events[1]!;
  TestValidator.predicate(
    "snapshots retain old and new identities on one population",
    before.landmarks.length > initial.length &&
      equivalent(
        before.landmarks.map(
          (landmark: IAutoMovieRecoveryMapLandmark): unknown => ({
            id: landmark.id,
            observations: landmark.observations,
          }),
        ),
        after.landmarks.map(
          (landmark: IAutoMovieRecoveryMapLandmark): unknown => ({
            id: landmark.id,
            observations: landmark.observations,
          }),
        ),
      ) &&
      before.landmarks.every(
        (landmark: IAutoMovieRecoveryMapLandmark): boolean =>
          evaluateRecoveryScenePoint(
            landmark.point,
            landmark.observations,
            before.poses,
            charts.slice(0, 3),
            fixture.input.policy,
          ).accepted,
      ),
  );
  TestValidator.predicate(
    "same-population joint cost and count accompany after state",
    after.joint !== null &&
      after.joint.observationCount ===
        after.landmarks.reduce(
          (sum: number, landmark: IAutoMovieRecoveryMapLandmark): number =>
            sum + landmark.observations.length,
          0,
        ) &&
      after.joint.finalCost < after.joint.initialCost,
  );
  const marker: Error = new Error(
    "camera-map: observer is not a numerical refusal",
  );
  let caught: unknown = null;
  try {
    completeRecoverySceneCheckpoint(
      poses,
      initial,
      tracks,
      charts,
      fixture.input.policy,
      budget,
      work(),
      (): void => {},
      (): void => {},
      (): void => {
        throw marker;
      },
    );
  } catch (error: unknown) {
    caught = error;
  }
  TestValidator.predicate(
    "observer failure propagates with its original identity",
    caught === marker,
  );
}
