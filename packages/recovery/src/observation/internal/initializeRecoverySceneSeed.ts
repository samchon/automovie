import type {
  IAutoMovieRecoveryCameraPairInput,
  IAutoMovieRecoveryMapObservation,
  IAutoMovieRecoverySceneSeedInitializationOperation,
} from "@automovie/interface";

import { createRecoveryCameraEstimate } from "./createRecoveryCameraEstimate";

/*
 * Estimate the explicit seed using only globally admitted direct reciprocal
 * links. This reconstructs pose support under the complete identity policy
 * instead of deleting landmarks after a prior local-map fit has influenced its
 * cameras.
 */
export function initializeRecoverySceneSeed(
  input: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[0],
  features: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[1],
  charts: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[2],
  pairs: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[3],
  tracks: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[4],
  checkpoint: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[5],
): ReturnType<IAutoMovieRecoverySceneSeedInitializationOperation.Operation> {
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
