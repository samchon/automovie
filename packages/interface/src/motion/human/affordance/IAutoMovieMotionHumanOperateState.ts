import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Contracts used by operateState.at.
 *
 * @evidence contracts/development/common.md#meaningful-documentation point: Unoperated contact point in world metres. normal: Unoperated surface normal in world coordinates. point: Operated contact point in world metres.
 * @evidence contracts/development/design.md#principled-representation point: Unoperated contact point in world metres. normal: Unoperated surface normal in world coordinates. point: Operated contact point in world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: affordance/operateState.ts (operateState.at, place); affordance/operateState.ts (operateState.at, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanOperateState {
  /**
   * The moving part's place at a progress of its movement. Input place of operateState.at. The part's place at rest: its point and outward normal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: Unoperated contact point in world metres. normal: Unoperated surface normal in world coordinates.
   * @evidence contracts/development/design.md#principled-representation point: Unoperated contact point in world metres. normal: Unoperated surface normal in world coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: affordance/operateState.ts (operateState.at, place).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IAtPlace = {
    /** Unoperated contact point in world metres. */
    point: IAutoMovieVector3;
    /** Unoperated surface normal in world coordinates. */
    normal: IAutoMovieVector3;
  };

  /**
   * The moving part's place at a progress of its movement. Result returned by operateState.at. The point and the normal, and the roll about the normal in degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: Operated contact point in world metres. normal: Operated surface normal in world coordinates. roll: Knob rotation in degrees; zero for mechanisms without knob roll.
   * @evidence contracts/development/design.md#principled-representation point: Operated contact point in world metres. normal: Operated surface normal in world coordinates. roll: Knob rotation in degrees; zero for mechanisms without knob roll.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: affordance/operateState.ts (operateState.at, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IAtResult = {
    /** Operated contact point in world metres. */
    point: IAutoMovieVector3;
    /** Operated surface normal in world coordinates. */
    normal: IAutoMovieVector3;
    /** Knob rotation in degrees; zero for mechanisms without knob roll. */
    roll: number;
  };
}
