import type {
  IAutoMovieMotionHumanDress,
  IAutoMovieMotionHumanGesture,
  IAutoMovieMotionHumanHandToFace,
  IAutoMovieMotionHumanLook,
  IAutoMovieMotionHumanOperate,
  IAutoMovieMotionHumanRest,
  IAutoMovieMotionHumanSelfAction,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTypeText,
  IAutoMovieMotionHumanUseTool,
  IAutoMovieMotionHumanWipe,
} from "@automovie/interface";

import { AutoMovieMotionHumanChainPosture } from "./AutoMovieMotionHumanChainPosture";

/**
 * The chain methods of the hands, the head and the eyes on the body's own
 * support: looking, gesturing, resting the hands, touching, the daily tasks at
 * the face, dressing, and working a tool, a surface, a mechanism or a
 * keyboard.
 */
export class AutoMovieMotionHumanChainManual extends AutoMovieMotionHumanChainPosture {
  /**
   * Stand and look at a target, turning the eyes, head and trunk.
   *
   * @param params Target, recruitment, cue and time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public look(
    params: IAutoMovieMotionHumanLook.IParams,
    anchor?: string,
  ): this {
    return this.act("look", params, anchor);
  }

  /**
   * Make a communicative gesture of the hands, head or trunk.
   *
   * @param params The gesture and its options.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public gesture(
    params: IAutoMovieMotionHumanGesture.IParams,
    anchor?: string,
  ): this {
    return this.act("gesture", params, anchor);
  }

  /**
   * Stand with the hands at rest places (pockets, hips, crossed arms).
   *
   * @param params Each hand's place and the time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public rest(
    params: IAutoMovieMotionHumanRest.IParams = {},
    anchor?: string,
  ): this {
    return this.act("rest", params, anchor);
  }

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
  public touch(
    params: IAutoMovieMotionHumanTouch.IParams,
    anchor?: string,
  ): this {
    return this.act("touch", params, anchor);
  }

  /**
   * Perform a whole-body self action: a stretch, victory arms, a fist pump, a
   * neck or shoulder roll.
   *
   * @param params The kind, the hand and the count.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public selfAction(
    params: IAutoMovieMotionHumanSelfAction.IParams,
    anchor?: string,
  ): this {
    return this.act("selfAction", params, anchor);
  }

  /**
   * Append a hand-to-face task such as drinking, eating, reading or grooming.
   * Arrival cues such as `atMouth` mark the end of the approach. `taskEnd`
   * marks the end of the stroke, and `relax` opens the return.
   *
   * When supplied, `prop` must already be held in the acting hand and have the
   * requested contact. Drinking from a prop requires a grip prepared for use
   * at the mouth. The performance refuses an incompatible grip when it plans
   * the action.
   *
   * @param params The task or supplied row, acting hand, repetitions and hold.
   * @param anchor The optional id used to align this action to other actions.
   * @returns The chain carrying the appended action.
   * @example
   * actor.handToFace({ kind: "drink" })

   */
  public handToFace(
    params: IAutoMovieMotionHumanHandToFace.IParams,
    anchor?: string,
  ): this {
    return this.act("handToFace", params, anchor);
  }

  /**
   * Put on a hat or a pair of glasses with both hands.
   *
   * @param params The item.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public dress(
    params: IAutoMovieMotionHumanDress.IParams,
    anchor?: string,
  ): this {
    return this.act("dress", params, anchor);
  }

  /**
   * Work a one-handed tool in cycles over a work point: a hammer, a saw, a
   * spoon or a screwdriver.
   *
   * @param params The tool, the work point, the hand and the cycles.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public useTool(
    params: IAutoMovieMotionHumanUseTool.IParams,
    anchor?: string,
  ): this {
    return this.act("useTool", params, anchor);
  }

  /**
   * Wipe a level surface with the flat palm in circles.
   *
   * @param params The surface point, the hand and the cycles.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public wipe(
    params: IAutoMovieMotionHumanWipe.IParams,
    anchor?: string,
  ): this {
    return this.act("wipe", params, anchor);
  }

  /**
   * Press a button, turn a knob, slide a drawer or swing a door by its handle.
   *
   * @param params The mechanism and the hand.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public operate(
    params: IAutoMovieMotionHumanOperate.IParams,
    anchor?: string,
  ): this {
    return this.act("operate", params, anchor);
  }

  /**
   * Type a text on a keyboard with the index fingertips, holding the current
   * posture.
   *
   * @param params The keyboard's prop subject and the text.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public typeText(
    params: IAutoMovieMotionHumanTypeText.IParams,
    anchor?: string,
  ): this {
    return this.act("typeText", params, anchor);
  }
}
