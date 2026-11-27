import type { IAutoMovieMotionHumanPutDown } from "./IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanArchery } from "./IAutoMovieMotionHumanArchery";
import type { IAutoMovieMotionHumanOperate } from "./IAutoMovieMotionHumanOperate";

/**
 * Open parameters of the archery lexicon family, keyed by each runtime export
 * name. Release rows can also transfer one staged prop onto an authored
 * continuation.
 */
export interface IAutoMovieMotionHumanLexiconArcheryParams {
  /** Take an arrow by its shaft. */
  takeArrow: IAutoMovieMotionHumanArchery.ITakeArrow;

  /** Set the arrow's nock on the bow's string. */
  nockArrow: IAutoMovieMotionHumanPutDown.IParams;

  /** Hold the bow out in one hand on the line from the face to the target. */
  presentBow: IAutoMovieMotionHumanArchery.IPresentBow;

  /** Draw the string back to the anchor, over `presentBow`. */
  drawBow: IAutoMovieMotionHumanOperate.IParams;

  /**
   * Release the arrow prop, with an optional authored continuation after the
   * cue.
   */
  loose: IAutoMovieMotionHumanArchery.ILoose;

  /** Span a crossbow by its string or its crank. */
  spanCrossbow: IAutoMovieMotionHumanOperate.IParams;

  /** Hold the crossbow to the cheek on the line to the target. */
  presentCrossbow: IAutoMovieMotionHumanArchery.IPresentCrossbow;

  /**
   * Cue the crossbow's visible release and transfer the bolt to a continuation
   * when supplied.
   */
  shootCrossbow: IAutoMovieMotionHumanArchery.IShootCrossbow;
}
/** References shared by the staged bow and crossbow cues. */
export namespace IAutoMovieMotionHumanLexiconArcheryParams {
  /**
   * Transfer one prop from its current nock onto a scene-authored animation
   * carrier. The mount maintains the prop's frame across the cue.
   */
  export interface IContinuation {
    /** Subject id of the staged bow or crossbow currently carrying the prop. */
    source: string;

    /** Subject id of the staged arrow or bolt to transfer. */
    prop: string;

    /** Subject id of the scene-authored animation carrier. */
    onto: string;

    /**
     * Socket affordance on the animation carrier that takes the prop at the
     * cue.
     */
    point: string;
  }
}
