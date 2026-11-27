import type { IAutoMovieMotionHumanHandToFace } from "./IAutoMovieMotionHumanHandToFace";
import type { IAutoMovieMotionHumanLook } from "./IAutoMovieMotionHumanLook";
import type { IAutoMovieMotionHumanRest } from "./IAutoMovieMotionHumanRest";
import type { IAutoMovieMotionHumanTypeText } from "./IAutoMovieMotionHumanTypeText";
import type { IAutoMovieMotionHumanDress } from "./IAutoMovieMotionHumanDress";
import type { IAutoMovieMotionHumanGesture } from "./IAutoMovieMotionHumanGesture";
import type { IAutoMovieMotionHumanOperate } from "./IAutoMovieMotionHumanOperate";
import type { IAutoMovieMotionHumanTouch } from "./IAutoMovieMotionHumanTouch";
import type { IAutoMovieMotionHumanUseTool } from "./IAutoMovieMotionHumanUseTool";
import type { IAutoMovieMotionHumanWipe } from "./IAutoMovieMotionHumanWipe";
import type { IAutoMovieMotionHumanSelfAction } from "./IAutoMovieMotionHumanSelfAction";
import type { IAutoMovieMotionHumanChainPosture } from "./IAutoMovieMotionHumanChainPosture";

/**
 * The chain methods of the hands, the head and the eyes on the body's own
 * support: looking, gesturing, resting the hands, touching, the daily tasks at
 * the face, dressing, and working a tool, a surface, a mechanism or a
 * keyboard.
 */
export interface IAutoMovieMotionHumanChainManual extends IAutoMovieMotionHumanChainPosture {
  /**
   * Stand and look at a target, turning the eyes, head and trunk.
   *
   * @param params Target, recruitment, cue and time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  look(params: IAutoMovieMotionHumanLook.IParams, anchor?: string): this;

  /**
   * Make a communicative gesture of the hands, head or trunk.
   *
   * @param params The gesture and its options.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  gesture(params: IAutoMovieMotionHumanGesture.IParams, anchor?: string): this;

  /**
   * Stand with the hands at rest places (pockets, hips, crossed arms).
   *
   * @param params Each hand's place and the time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  rest(params?: IAutoMovieMotionHumanRest.IParams, anchor?: string): this;

  /**
   * Lay a hand on a partner's or one's own region and move it there by a kind
   * of touch: a tap, a pat, a stroke, a rub, a press, a squeeze, a hold or a
   * scratch.
   *
   * @param params The region, the kind, the part of the hand, the hand and the
   *   timing.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  touch(params: IAutoMovieMotionHumanTouch.IParams, anchor?: string): this;

  /**
   * Perform a whole-body self action: a stretch, victory arms, a fist pump, a
   * neck or shoulder roll.
   *
   * @param params The kind, the hand and the count.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  selfAction(
    params: IAutoMovieMotionHumanSelfAction.IParams,
    anchor?: string,
  ): this;

  /**
   * Perform a hand-to-face task of daily living: drink, eat, phone, read or
   * groom.
   *
   * @param params The task, the hand, the count and the time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  handToFace(
    params: IAutoMovieMotionHumanHandToFace.IParams,
    anchor?: string,
  ): this;

  /**
   * Put on a hat or a pair of glasses with both hands.
   *
   * @param params The item.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  dress(params: IAutoMovieMotionHumanDress.IParams, anchor?: string): this;

  /**
   * Work a one-handed tool in cycles over a work point: a hammer, a saw, a
   * spoon or a screwdriver.
   *
   * @param params The tool, the work point, the hand and the cycles.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  useTool(params: IAutoMovieMotionHumanUseTool.IParams, anchor?: string): this;

  /**
   * Wipe a level surface with the flat palm in circles.
   *
   * @param params The surface point, the hand and the cycles.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  wipe(params: IAutoMovieMotionHumanWipe.IParams, anchor?: string): this;

  /**
   * Press a button, turn a knob, slide a drawer or swing a door by its handle.
   *
   * @param params The mechanism and the hand.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  operate(params: IAutoMovieMotionHumanOperate.IParams, anchor?: string): this;

  /**
   * Type a text on a keyboard with the index fingertips, holding the current
   * posture.
   *
   * @param params The keyboard's prop subject and the text.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  typeText(
    params: IAutoMovieMotionHumanTypeText.IParams,
    anchor?: string,
  ): this;
}
