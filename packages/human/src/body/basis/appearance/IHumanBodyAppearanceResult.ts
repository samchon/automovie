import type { IAutoMovieMaterial } from "@automovie/interface";
import type { createHumanBodySkinColour } from "./createHumanBodySkinColour";

/**
 * Fresh document materials beside optional site-color output in source vertex order.
 *
 * @evidence contracts/common.md#principled-implementation Copied material records and optional source-corresponding color multipliers carry one completed appearance evaluation.
 * @evidence contracts/common.md#clear-and-simple-design Material objects stay separate from geometric vertex-color arrays so the surface projector consumes each through its existing seam.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored appearance relations cannot certify an individual's measured chromophore distribution or clinical skin physiology.
 * @evidence contracts/common.md#meaningful-documentation Members state fresh material ownership and null when no cheek-driven site colors were requested.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Appearance-result typing performs no material cloning or vertex-color aggregation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Completed material/color fields expose output without implementing cross-document appearance caches.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The result schema describes consumer-owned arrays and acquires no renderer texture or retained evaluator.
 * @author Samchon
 */
export interface IHumanBodyAppearanceResult {
  /** Fresh copied material records for this document. */
  materials: IAutoMovieMaterial[];

  /** Source-order site color multipliers, or null without a cheek input. */
  coloured: ReturnType<ReturnType<typeof createHumanBodySkinColour>> | null;
}
