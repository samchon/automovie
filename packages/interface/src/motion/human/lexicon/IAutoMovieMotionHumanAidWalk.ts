import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A held prop's support order and a sequence of authored floor stations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the single-grip or paired-grip prop and the staged floor stations. The law admits the held grip and placement.
 * @evidence contracts/development/design.md#principled-representation The aid's two grip counts are distinct alternatives. Floor stations use world metres and signed yaw relative to entry in degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The action uses one prop, its selected support order, and the requested stations and timing.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A walker needs both hands and forbids a separate hand selection. Geometry comes from the staged prop, not the request.
 */
export type IAutoMovieMotionHumanAidWalk = (
  | {
      /** A single-grip aid that swings with the opposite step. */
      kind: "cane" | "crutch";

      /** The hand that closes on the aid. Defaults to right. */
      hand?: AutoMovieHumanSide;
    }
  | {
      /** A walker that advances during both-foot support. */
      kind: "walker";
    }
) & {
  /**
   * The staged prop with its floor track. A cane or crutch declares a grip and a tip.
   * A walker declares two grips and a common floor tip.
   */
  prop: string;

  /** Consecutive floor stations of the body, from the held standing pose. */
  stations: readonly IAutoMovieMotionHumanAidWalk.IStation[];
};

/** Floor stations for the aided walk. */
export namespace IAutoMovieMotionHumanAidWalk {
  /**
   * A floor endpoint and the film time available to reach it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world position, relative turn and phase duration.
   * @evidence contracts/development/design.md#principled-representation A floor point uses only horizontal coordinates while heading and seconds are separate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A station supplies the endpoint and timing for the rigid aid and both soles.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The runtime owner admits timing and rejects unreachable placements. The record has no joint or prop keyframes.
   */
  export interface IStation {
    /** World X displacement from the entry station, in metres. */
    x: number;

    /** World Z displacement from the entry station, in metres. */
    z: number;

    /** Heading change relative to the action entry, in degrees. Defaults to zero. */
    turn?: number;

    /** Positive film seconds to advance the aid and both feet once. */
    seconds: number;
  }
}
