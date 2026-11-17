import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";

/**
 * Contracts used by manipulate.sequence.placed, manipulateFacing, manipulateFacing.mine, manipulate.sequence.
 *
 * @evidence contracts/development/common.md#meaningful-documentation site: The site, world metres.
 * @evidence contracts/development/design.md#principled-representation site: The site, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/manipulate.ts (manipulate.sequence.placed, return); handling/manipulateFacing.ts (manipulateFacing, presses); handling/manipulateFacing.ts (manipulateFacing.mine, p); handling/manipulate.ts (manipulate.sequence); handling/manipulateFacing.ts (manipulateFacing).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanHand.Side identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanManipulateFacing {
  /**
   * A site a hand presses, as the rotation reads it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation site: The site, world metres.
   * @evidence contracts/development/design.md#principled-representation site: The site, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/manipulate.ts (manipulate.sequence.placed, return); handling/manipulateFacing.ts (manipulateFacing, presses); handling/manipulateFacing.ts (manipulateFacing.mine, p); handling/manipulate.ts (manipulate.sequence); handling/manipulateFacing.ts (manipulateFacing).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanHand.Side identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ISite {
    /** The site, world metres. */
    site: IAutoMovieVector3;

    /** Its outward normal, world. */
    normal: IAutoMovieVector3;

    /** The pressing hand. */
    side: IAutoMovieMotionHumanHand.Side;
  }
}
