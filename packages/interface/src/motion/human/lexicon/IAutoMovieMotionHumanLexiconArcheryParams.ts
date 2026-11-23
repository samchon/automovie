import type { IAutoMovieMotionHumanPutDown } from "../handling/IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanArchery } from "../next/IAutoMovieMotionHumanArchery";
import type { IAutoMovieMotionHumanOperate } from "../next/IAutoMovieMotionHumanOperate";

/**
 * Open parameters of the archery lexicon family, keyed by each runtime export name.
 * Release rows can also transfer one staged prop onto an authored continuation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The archery family is a closed export-name map that reuses source law types and adds one shared continuation record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the archery row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
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

  /** Release the arrow prop, with an optional authored continuation after the cue. */
  loose: IAutoMovieMotionHumanArchery.ILoose;

  /** Span a crossbow by its string or its crank. */
  spanCrossbow: IAutoMovieMotionHumanOperate.IParams;

  /** Hold the crossbow to the cheek on the line to the target. */
  presentCrossbow: IAutoMovieMotionHumanArchery.IPresentCrossbow;

  /** Cue the crossbow's visible release and transfer the bolt to a continuation when supplied. */
  shootCrossbow: IAutoMovieMotionHumanArchery.IShootCrossbow;
}
/** References shared by the staged bow and crossbow cues. */
export namespace IAutoMovieMotionHumanLexiconArcheryParams {
  /**
   * Transfer one prop from its current nock onto a scene-authored animation carrier. The mount maintains the prop's frame across the cue.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the source, transferred identity, destination mark and transition behavior.
   * @evidence contracts/development/design.md#principled-representation Four subject and affordance references specify the scene mount without encoding a flight model.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both release rows accept this one record; the performance mount and carrier own pose evaluation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values identify subjects and a socket. HumanArcheryCue owns scene-reference admission.
   */
  export interface IContinuation {
    /** Subject id of the staged bow or crossbow currently carrying the prop. */
    source: string;

    /** Subject id of the staged arrow or bolt to transfer. */
    prop: string;

    /** Subject id of the scene-authored animation carrier. */
    onto: string;

    /** Socket affordance on the animation carrier that takes the prop at the cue. */
    point: string;
  }
}
