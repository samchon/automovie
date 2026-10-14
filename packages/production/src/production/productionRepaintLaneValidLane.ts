import { IAutoMovieVisualDeliveryLane } from "./IAutoMovieVisualDeliveryLane";
import { productionRepaintLaneIsExactText } from "./productionRepaintLaneIsExactText";
import { productionRepaintLaneIsDigest } from "./productionRepaintLaneIsDigest";

/**
 * Check the selected source's exact path text and digest syntax with a null opposite family. The typed lane discriminator is a caller premise; this helper reads no resident artifact and may throw on missing nested records.
 *
 * @evidence contracts/common.md#principled-implementation The discriminant selects deterministic path/digest or repaint output/receipt/selection digests and requires the opposite source to be null.
 * @evidence contracts/common.md#clear-and-simple-design Lane metadata validation stays separate from occurrence joining and byte/current-receipt admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A nonblank path or digest spelling is no filesystem containment, media integrity or reviewed-selection proof; foreign discriminants require prior schema admission.
 * @evidence contracts/common.md#meaningful-documentation Prose states exclusive families, typed discriminator premise and potentially throwing nested access.
 * @evidence contracts/performance.md#efficient-algorithms Fixed selected fields incur path trimming and shared digest regex scans; work follows their text lengths without media traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This predicate owns no metadata/currentness cache or request coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the boolean escapes; trim temporaries expire and no source record, media bytes or handle is retained.
 */
export const productionRepaintLaneValidLane: (lane: IAutoMovieVisualDeliveryLane) => boolean = (lane: IAutoMovieVisualDeliveryLane): boolean =>
  lane.lane === "deterministic"
    ? lane.repaint === null &&
      productionRepaintLaneIsExactText(lane.deterministic.path) &&
      productionRepaintLaneIsDigest(lane.deterministic.digest)
    : lane.deterministic === null &&
      productionRepaintLaneIsExactText(lane.repaint.path) &&
      productionRepaintLaneIsDigest(lane.repaint.digest) &&
      productionRepaintLaneIsDigest(lane.repaint.receiptDigest) &&
      productionRepaintLaneIsDigest(lane.repaint.selectionDigest);
