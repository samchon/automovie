import type { extractRecoveryImageFeatures } from "../../internal/extractRecoveryImageFeatures";
import type { linkRecoveryCameraTracks } from "../../internal/linkRecoveryCameraTracks";

/**
 * Once-observed bounded image-set features and both directed pair populations.
 *
 * @evidence contracts/development/design.md#principled-representation Original per-image feature indices and automatic directed matches remain fixed for all subsequent scene geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named internal result serves exact-map and variable-scene observation consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These tentative appearance observations supply neither material truth nor accepted geometry.
 * @evidence contracts/development/common.md#meaningful-documentation Members define transient descriptors, unordered pair order and actual directed comparison count.
 */
export interface IAutoMovieRecoveryCameraSetObservation {
  /** Source-order features, including transient numerical descriptors. */
  features: ReturnType<typeof extractRecoveryImageFeatures>[];

  /** One forward/reverse record for each unordered image pair. */
  pairs: Parameters<typeof linkRecoveryCameraTracks>[1][number][];

  /** Actual total oriented descriptor pairs compared. */
  descriptorComparisons: number;
}
