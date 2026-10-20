import type {
  IAutoMovieRecoveryCameraBudget,
  IAutoMovieRecoveryCameraPolicy,
  IAutoMovieRecoveryCameraView,
} from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryCameraSetObservation } from "../structures/internal/IAutoMovieRecoveryCameraSetObservation";
import { extractRecoveryImageFeatures } from "./extractRecoveryImageFeatures";
import { matchRecoveryImageFeatures } from "./matchRecoveryImageFeatures";

/**
 * Observe each fixed chart once and match every admitted pair in both directions.
 *
 * @evidence contracts/common.md#principled-implementation Existing Harris/descriptor and strict ratio/mutual matcher semantics remain unchanged. Actual aggregate directed comparisons are checked before the first pair traversal.
 * @evidence contracts/common.md#clear-and-simple-design The same bounded acquisition phase serves exact-three-view maps and variable-view scenes; their admission, geometry and terminal semantics remain with their operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No changed ratio, learned features, source/truth lookup, camera-order prior or partial old match cache supplies observations.
 * @evidence contracts/common.md#meaningful-documentation States once-per-chart extraction, ordered unordered-pair traversal, both matching directions and aggregate versus pair work limits.
 * @evidence contracts/performance.md#efficient-algorithms N detections retain their admitted pixel/candidate cost; exhaustive matches cost O(128*sum(2FiFj)) with safe aggregate admission before comparison. Retained pair records are bounded by N and per-image feature ceilings.
 * @evidence contracts/performance.md#reuse-equivalent-work Every pair reuses the same once-observed features, and both map owners consume these results without redetection or rematching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only call-owned features and index matches return to the enclosing operation; pyramids expire per extraction and no global cache, pixel copy or external handle remains.
 */
export function observeRecoveryCameraSet(
  views: readonly IAutoMovieRecoveryCameraView[],
  policy: IAutoMovieRecoveryCameraPolicy,
  budget: IAutoMovieRecoveryCameraBudget,
  maximumComparisons: number,
  checkpoint: (phase: string, completed: number, total: number) => void,
): IAutoMovieRecoveryCameraSetObservation {
  const features: ReturnType<typeof extractRecoveryImageFeatures>[] = [];
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
  if (
    !Number.isSafeInteger(descriptorComparisons) ||
    !Number.isSafeInteger(pairCount) ||
    descriptorComparisons > maximumComparisons
  )
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
