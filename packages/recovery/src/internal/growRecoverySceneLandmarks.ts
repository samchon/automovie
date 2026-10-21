import type {
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryCameraSceneBudget,
} from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapLandmark } from "../structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapObservation } from "../structures/image/IAutoMovieRecoveryMapObservation";
import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoverySceneWork } from "../structures/image/IAutoMovieRecoverySceneWork";
import type { IAutoMovieRecoverySceneGrowth } from "../structures/internal/IAutoMovieRecoverySceneGrowth";
import type { createRecoveryCameraChart } from "./createRecoveryCameraChart";
import { assertRecoverySceneLinearRetention } from "./assertRecoverySceneLinearRetention";
import type { linkRecoveryCameraTracks } from "./linkRecoveryCameraTracks";
import { projectRecoveryMapPoint } from "./projectRecoveryMapPoint";
import { spendRecoverySceneWork } from "./spendRecoverySceneWork";
import { triangulateRecoverySceneTrack } from "./triangulateRecoverySceneTrack";

/**
 * Propose point and measurement growth using only currently registered poses.
 * Existing points receive only individually positive-depth pixel-qualified
 * measurements; new points must pass every available registered observation.
 *
 * @evidence contracts/common.md#principled-implementation Fixed global nonconflicting feature components own identities. New original-design multiview triangulation uses registered cameras only, while existing point coordinates stay unchanged before candidate joint fitting.
 * @evidence contracts/common.md#clear-and-simple-design This owner builds a detached proposal; the coordinator commits no pose, point or observation until complete joint and final geometry qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unregistered target creates its own PnP evidence, no global conflict is split, no old measurement is deleted, and no failed point becomes a landmark.
 * @evidence contracts/common.md#meaningful-documentation States asymmetric new-point/all-observation and existing-point/individual-extension gates, strict growth counts, shared work charging and detached ownership.
 * @evidence contracts/performance.md#efficient-algorithms L existing landmarks and E global linked measurements use O(L+E) identity/projection work plus one charged bounded four-column design and O(k^2) qualification for each eligible unmapped track.
 * @evidence contracts/performance.md#reuse-equivalent-work Frozen track coordinates, charts and existing point estimates are reused without detection, matching or re-triangulating already accepted points.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A bounded detached point/measurement proposal returns; local maps and rejected point scratch expire. Work counters remain owned by the enclosing scene even when geometry rolls back.
 */
export function growRecoverySceneLandmarks(
  tracks: ReturnType<typeof linkRecoveryCameraTracks>["tracks"],
  initial: readonly IAutoMovieRecoveryMapLandmark[],
  poses: readonly (IAutoMovieRecoveryMapPose | null)[],
  charts: readonly ReturnType<typeof createRecoveryCameraChart>[],
  policy: IAutoMovieRecoveryCameraMapPolicy,
  budget: IAutoMovieRecoveryCameraSceneBudget,
  work: IAutoMovieRecoverySceneWork,
  checkpoint: () => void,
): IAutoMovieRecoverySceneGrowth {
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
        const projected: ReturnType<typeof projectRecoveryMapPoint> =
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
    const candidate: ReturnType<typeof triangulateRecoverySceneTrack> =
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
