import { IAutoMovieVisualDeliveryLane } from "./IAutoMovieVisualDeliveryLane";
import { productionRepaintLaneValidLane } from "./productionRepaintLaneValidLane";

/**
 * Turn selected-source validation exceptions into a source refusal. Missing nested sources and hostile access cannot publish usable segments through this boundary; independent callback side effects are not undone.
 *
 * @evidence contracts/common.md#principled-implementation A narrow exception boundary converts any selected-source reader failure to false, preserving fail-closed planning.
 * @evidence contracts/common.md#clear-and-simple-design The delegated predicate owns source metadata policy and this wrapper owns exception-to-refusal conversion only.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exceptions become invalid source rather than deterministic fallback, while the delegated typed discriminator premise is unchanged.
 * @evidence contracts/common.md#meaningful-documentation Prose gives false-on-exception semantics and external-side-effect limits.
 * @evidence contracts/performance.md#efficient-algorithms Wrapper work is constant beyond the delegated selected path/digest scans; no second validation or buffer copy is added.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each supplied lane is read anew without retained prior verdicts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Neither caught exception nor source is retained and only a boolean escapes; no runtime handle is acquired.
 */
export const productionRepaintLaneSafeValidLane: (lane: IAutoMovieVisualDeliveryLane) => boolean = (lane: IAutoMovieVisualDeliveryLane): boolean => {
  try {
    return productionRepaintLaneValidLane(lane);
  } catch {
    return false;
  }
};
