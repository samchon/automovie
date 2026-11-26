import type {
  IAutoMovieRecoveryCameraBudget,
  IAutoMovieRecoveryCameraPolicy,
  IAutoMovieRecoveryCameraSetObservation,
  IAutoMovieRecoveryCameraView,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
} from "@automovie/interface";

import { extractRecoveryImageFeatures } from "./extractRecoveryImageFeatures";
import { matchRecoveryImageFeatures } from "../observation/internal/matchRecoveryImageFeatures";

/**
 * Observe each fixed chart once and match every admitted pair in both
 * directions.
 */
export function observeRecoveryCameraSet(
  views: readonly IAutoMovieRecoveryCameraView[],
  policy: IAutoMovieRecoveryCameraPolicy,
  budget: IAutoMovieRecoveryCameraBudget,
  maximumComparisons: number,
  checkpoint: (phase: string, completed: number, total: number) => void,
): IAutoMovieRecoveryCameraSetObservation {
  const features: ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[] =
    [];
  for (const view of views) {
    checkpoint("image-features", features.length, views.length);
    features.push(extractRecoveryImageFeatures(view, policy, budget));
  }
  checkpoint("image-features", views.length, views.length);
  let descriptorComparisons: number = 0;
  for (let first: number = 0; first < views.length; first++)
    for (let second: number = first + 1; second < views.length; second++)
      descriptorComparisons +=
        2 * features[first]!.points.length * features[second]!.points.length;
  const pairCount: number = (views.length * (views.length - 1)) / 2;
  if (descriptorComparisons > maximumComparisons)
    throw new Error("camera-map: aggregate descriptor pair budget exhausted");
  const pairs: IAutoMovieRecoveryCameraSetObservation["pairs"] = [];
  for (let first: number = 0; first < views.length; first++)
    for (let second: number = first + 1; second < views.length; second++) {
      checkpoint("descriptor-matching", pairs.length, pairCount);
      pairs.push({
        first,
        second,
        forward: matchRecoveryImageFeatures(
          features[first]!.points,
          features[second]!.points,
          policy.descriptorDistanceRatio,
          budget.maxDescriptorPairs,
        ),
        reverse: matchRecoveryImageFeatures(
          features[second]!.points,
          features[first]!.points,
          policy.descriptorDistanceRatio,
          budget.maxDescriptorPairs,
        ),
      });
    }
  checkpoint("descriptor-matching", pairCount, pairCount);
  return { features, pairs, descriptorComparisons };
}
