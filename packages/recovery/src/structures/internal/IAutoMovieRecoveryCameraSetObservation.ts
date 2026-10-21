import type { extractRecoveryImageFeatures } from "../../internal/extractRecoveryImageFeatures";
import type { linkRecoveryCameraTracks } from "../../internal/linkRecoveryCameraTracks";

/**
 * Once-observed bounded image-set features and both directed pair populations.
 *
 * @evidence contracts/common.md#principled-implementation Original per-image feature indices and automatic directed matches remain fixed for all subsequent scene geometry.
 * @evidence contracts/common.md#clear-and-simple-design One named internal result serves exact-map and variable-scene observation consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These tentative appearance observations supply neither material truth nor accepted geometry.
 * @evidence contracts/common.md#meaningful-documentation Members define transient descriptors, unordered pair order and actual directed comparison count.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result performs no observation or fitting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Its enclosing operation reuses the same fixed feature/match populations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call owns bounded descriptors/matches and releases them after geometry; the public artifact contains neither.
 */
export interface IAutoMovieRecoveryCameraSetObservation {
  /** Source-order features, including transient numerical descriptors. */
  features: ReturnType<typeof extractRecoveryImageFeatures>[];

  /** One forward/reverse record for each unordered image pair. */
  pairs: Parameters<typeof linkRecoveryCameraTracks>[1][number][];

  /** Actual total oriented descriptor pairs compared. */
  descriptorComparisons: number;
}
