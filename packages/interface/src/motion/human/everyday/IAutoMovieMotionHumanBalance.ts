import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Contracts used by HumanBalance.support.
 *
 * @evidence contracts/development/common.md#meaningful-documentation centre: Whole-body centre of mass of the supplied posture in world metres; not the support polygon's centre. points: World-space support points in metres, used to judge the body's balance.
 * @evidence contracts/development/design.md#principled-representation centre: Whole-body centre of mass of the supplied posture in world metres; not the support polygon's centre. points: World-space support points in metres, used to judge the body's balance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/HumanBalance.ts (HumanBalance.support, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanBalance {
  /**
   * The engine's whole-body centre of mass of a posture and the support points of its feet (the bearing outline of each, `HumanFoot.base`), world metres. Result returned by HumanBalance.support. The centre and the support points.
   *
   * @evidence contracts/development/common.md#meaningful-documentation centre: Whole-body centre of mass of the supplied posture in world metres; not the support polygon's centre. points: World-space support points in metres, used to judge the body's balance.
   * @evidence contracts/development/design.md#principled-representation centre: Whole-body centre of mass of the supplied posture in world metres; not the support polygon's centre. points: World-space support points in metres, used to judge the body's balance.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/HumanBalance.ts (HumanBalance.support, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type ISupportResult = {
    /** Whole-body centre of mass of the supplied posture in world metres; not the support polygon's centre. */
    centre: IAutoMovieVector3;
    /** World-space support points in metres, used to judge the body's balance. */
    points: IAutoMovieVector3[];
  };
}
