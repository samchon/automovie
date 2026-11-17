import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanCarried } from "./IAutoMovieMotionHumanCarried";

/**
 * Contracts used by HumanCarriedCoupling.couple.
 *
 * @evidence contracts/development/common.md#meaningful-documentation body: Borrowed second bearer's body.
 * @evidence contracts/development/design.md#principled-representation body: Borrowed second bearer's body.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.couple, second).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanCarried.IRow, IAutoMovieMotionHumanCarried.Carry identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanCarriedCoupling {
  /**
   * The coupling of a carry between two bodies, refused when the bearer cannot balance the borne mass. Input second of HumanCarriedCoupling.couple. A second helper on the carry's other side: its body, its side's row and carry; none when absent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation body: Borrowed second bearer's body.
   * @evidence contracts/development/design.md#principled-representation body: Borrowed second bearer's body.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.couple, second).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanCarried.IRow, IAutoMovieMotionHumanCarried.Carry identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type ICoupleSecond = {
    /** Borrowed second bearer's body. */
    body: IAutoMovieMotionHumanBody;
    /** Second bearer's selected carried-action row. */
    row: IAutoMovieMotionHumanCarried.IRow;
    /** Second bearer's load-bearing arrangement. */
    carry: IAutoMovieMotionHumanCarried.Carry;
  };
}
