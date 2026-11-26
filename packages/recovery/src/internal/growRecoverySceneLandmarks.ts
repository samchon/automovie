import type {
  IAutoMovieRecoveryMapLandmark,
  IAutoMovieRecoveryMapObservation,
  IAutoMovieRecoveryMapPointProjectionOperation,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoverySceneLandmarksGrowthOperation,
  IAutoMovieRecoverySceneTrackTriangulationOperation,
} from "@automovie/interface";

import { assertRecoverySceneLinearRetention } from "./assertRecoverySceneLinearRetention";
import { projectRecoveryMapPoint } from "../observation/internal/projectRecoveryMapPoint";
import { spendRecoverySceneWork } from "./spendRecoverySceneWork";
import { triangulateRecoverySceneTrack } from "../observation/internal/triangulateRecoverySceneTrack";

/**
 * Propose point and measurement growth using only currently registered poses.
 * Existing points receive only individually positive-depth pixel-qualified
 * measurements; new points must pass every available registered observation.
 */
export function growRecoverySceneLandmarks(
  tracks: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[0],
  initial: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[1],
  poses: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[2],
  charts: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[3],
  policy: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[4],
  budget: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[5],
  work: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[6],
  checkpoint: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[7],
): ReturnType<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation> {
  const activeCount: number = poses.reduce(
    (sum: number, pose: IAutoMovieRecoveryMapPose | null): number =>
      sum + (pose === null ? 0 : 1),
    0,
  );
  let observationCount: number = initial.reduce(
    (sum: number, landmark: IAutoMovieRecoveryMapLandmark): number =>
      sum + landmark.observations.length,
    0,
  );
  assertRecoverySceneLinearRetention(
    budget,
    activeCount,
    observationCount,
    initial.length,
  );
  const landmarks: IAutoMovieRecoveryMapLandmark[] = initial.map(
    (
      landmark: IAutoMovieRecoveryMapLandmark,
    ): IAutoMovieRecoveryMapLandmark => ({
      id: landmark.id,
      point: [...landmark.point],
      observations: landmark.observations.map(
        (
          observation: IAutoMovieRecoveryMapObservation,
        ): IAutoMovieRecoveryMapObservation => ({
          ...observation,
          pixel: [...observation.pixel],
        }),
      ),
    }),
  );
  const byId: Map<number, IAutoMovieRecoveryMapLandmark> = new Map(
    landmarks.map(
      (
        landmark: IAutoMovieRecoveryMapLandmark,
      ): [number, IAutoMovieRecoveryMapLandmark] => [landmark.id, landmark],
    ),
  );
  if (byId.size !== landmarks.length)
    throw new Error("camera-scene: duplicate accepted track identity");
  let addedLandmarks: number = 0,
    addedObservations: number = 0;
  for (const track of tracks) {
    checkpoint();
    const observations: IAutoMovieRecoveryMapObservation[] =
      track.observations.filter(
        (observation: IAutoMovieRecoveryMapObservation): boolean =>
          poses[observation.viewIndex] !== null,
      );
    const existing: IAutoMovieRecoveryMapLandmark | undefined = byId.get(
      track.id,
    );
    if (existing) {
      const retained: Set<number> = new Set(
        existing.observations.map(
          (observation: IAutoMovieRecoveryMapObservation): number =>
            observation.viewIndex,
        ),
      );
      for (const observation of observations) {
        if (retained.has(observation.viewIndex)) continue;
        const projected: ReturnType<IAutoMovieRecoveryMapPointProjectionOperation.Operation> =
          projectRecoveryMapPoint(
            poses[observation.viewIndex]!,
            existing.point,
            charts[observation.viewIndex]!.matrix,
          );
        if (
          projected !== null &&
          Math.hypot(
            projected.pixel[0] - observation.pixel[0],
            projected.pixel[1] - observation.pixel[1],
          ) <= policy.maximumReprojectionErrorPx
        ) {
          assertRecoverySceneLinearRetention(
            budget,
            activeCount,
            observationCount + 1,
            landmarks.length,
          );
          existing.observations.push({
            ...observation,
            pixel: [...observation.pixel],
          });
          retained.add(observation.viewIndex);
          addedObservations++;
          observationCount++;
        }
      }
      continue;
    }
    if (observations.length < 2) continue;
    // Original rows, rotated/left columns, right bases and point/ray scratch
    // require fewer than 64k+128 scalar slots for this four-column design.
    assertRecoverySceneLinearRetention(
      budget,
      activeCount,
      observationCount,
      landmarks.length,
      64 * observations.length + 128,
    );
    spendRecoverySceneWork(work, budget, "triangulations", 1);
    spendRecoverySceneWork(
      work,
      budget,
      "linearWork",
      (2 * observations.length + 4) * 16 * (budget.maxSingularSweeps + 1) +
        observations.length * observations.length,
    );
    const candidate: ReturnType<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation> =
      triangulateRecoverySceneTrack(
        observations,
        poses,
        charts,
        policy,
        budget,
      );
    if (candidate.point === null) {
      work.triangulationRefusals++;
      continue;
    }
    assertRecoverySceneLinearRetention(
      budget,
      activeCount,
      observationCount + observations.length,
      landmarks.length + 1,
    );
    const landmark: IAutoMovieRecoveryMapLandmark = {
      id: track.id,
      point: candidate.point,
      observations: observations.map(
        (
          observation: IAutoMovieRecoveryMapObservation,
        ): IAutoMovieRecoveryMapObservation => ({
          ...observation,
          pixel: [...observation.pixel],
        }),
      ),
    };
    landmarks.push(landmark);
    byId.set(track.id, landmark);
    addedLandmarks++;
    addedObservations += observations.length;
    observationCount += observations.length;
  }
  const count: number = landmarks.reduce(
    (sum: number, landmark: IAutoMovieRecoveryMapLandmark): number =>
      sum + landmark.observations.length,
    0,
  );
  if (landmarks.length > budget.maxTracks || count > budget.maxObservations)
    throw new Error(
      "camera-scene: proposed retained support exceeds admitted limits",
    );
  return { landmarks, addedLandmarks, addedObservations };
}
