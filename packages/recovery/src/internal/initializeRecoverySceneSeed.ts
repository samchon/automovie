import type {
  IAutoMovieRecoveryCameraPairInput,
  IAutoMovieRecoveryCameraSceneInput,
} from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryCameraPairEstimate } from "../structures/image/IAutoMovieRecoveryCameraPairEstimate";
import type { IAutoMovieRecoveryMapObservation } from "../structures/image/IAutoMovieRecoveryMapObservation";
import type { createRecoveryCameraChart } from "./createRecoveryCameraChart";
import { createRecoveryCameraEstimate } from "./createRecoveryCameraEstimate";
import type { extractRecoveryImageFeatures } from "./extractRecoveryImageFeatures";
import type { linkRecoveryCameraTracks } from "./linkRecoveryCameraTracks";

/**
 * Estimate the explicit seed using only globally admitted direct reciprocal links.
 * This reconstructs pose support under the complete identity policy instead of
 * deleting landmarks after a prior local-map fit has influenced its cameras.
 *
 * @evidence contracts/common.md#principled-implementation Global nonconflicting components and exact seed forward/reverse intersection restrict correspondences before unchanged full pair estimation, including essential/homography/depth/parallax qualification.
 * @evidence contracts/common.md#clear-and-simple-design This owner contains the global-to-seed admission boundary; scene orchestration owns point construction and qualified checkpoint transactions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No old local pose, removed point, transitive-only seed edge, global conflict or truth transform supplies the seed.
 * @evidence contracts/common.md#meaningful-documentation States direct reciprocal support, original source ordering, unchanged seed policies and re-estimation under global admission.
 * @evidence contracts/performance.md#efficient-algorithms One O(E+M) track/match filter precedes the unchanged bounded seed estimator; sets avoid repeated component scans for individual matches.
 * @evidence contracts/performance.md#reuse-equivalent-work Fixed features, charts and matched indices are reused without observation or descriptor comparisons, while changed identity admission correctly invalidates earlier geometric results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the owned pair evidence returns; borrowed features and temporary index sets expire without global cache or external resources.
 */
export function initializeRecoverySceneSeed(
  input: IAutoMovieRecoveryCameraSceneInput,
  features: readonly ReturnType<typeof extractRecoveryImageFeatures>[],
  charts: readonly ReturnType<typeof createRecoveryCameraChart>[],
  pairs: Parameters<typeof linkRecoveryCameraTracks>[1],
  tracks: ReturnType<typeof linkRecoveryCameraTracks>["tracks"],
  checkpoint: (phase: string, completed: number, total: number) => void,
): IAutoMovieRecoveryCameraPairEstimate {
  const seedKeys: Set<string> = new Set();
  for (const track of tracks) {
    const first: IAutoMovieRecoveryMapObservation | undefined =
      track.observations.find(
        (observation: IAutoMovieRecoveryMapObservation): boolean =>
          observation.viewIndex === 0,
      );
    const second: IAutoMovieRecoveryMapObservation | undefined =
      track.observations.find(
        (observation: IAutoMovieRecoveryMapObservation): boolean =>
          observation.viewIndex === 1,
      );
    if (first && second)
      seedKeys.add(`${first.featureIndex}:${second.featureIndex}`);
  }
  const pair: (typeof pairs)[number] | undefined = pairs.find(
    (item: (typeof pairs)[number]): boolean =>
      item.first === 0 && item.second === 1,
  );
  if (!pair) throw new Error("camera-scene: explicit seed matches required");
  const reverseKeys: Set<string> = new Set(
    pair.reverse.map(
      (match: (typeof pair.reverse)[number]): string =>
        `${match.secondIndex}:${match.firstIndex}`,
    ),
  );
  const seedInput: IAutoMovieRecoveryCameraPairInput = {
    schema: "automovie-recovery-camera-pair-v1",
    objectId: input.objectId,
    rigidity: input.rigidity,
    cohort: input.cohort,
    views: input.views.slice(0, 2),
    policy: input.seedPolicy,
    budget: input.seedBudget,
  };
  return createRecoveryCameraEstimate(
    seedInput,
    features.slice(0, 2),
    pair.forward.filter(
      (match: (typeof pair.forward)[number]): boolean =>
        seedKeys.has(`${match.firstIndex}:${match.secondIndex}`) &&
        reverseKeys.has(`${match.firstIndex}:${match.secondIndex}`),
    ),
    [charts[0]!, charts[1]!],
    checkpoint,
  );
}
