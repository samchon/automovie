import type { IAutoMovieMotionHumanBody } from "./IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanCarried } from "./IAutoMovieMotionHumanCarried";

/** Contracts used by HumanCarriedCoupling.couple. */
export namespace IAutoMovieMotionHumanCarriedCoupling {
  /**
   * The coupling of a carry between two bodies, refused when the bearer cannot
   * balance the borne mass. Input second of HumanCarriedCoupling.couple. A
   * second helper on the carry's other side: its body, its side's row and
   * carry; none when absent.
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
