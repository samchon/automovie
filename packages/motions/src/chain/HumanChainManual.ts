import type { operate } from "../affordance/operate";
import type { handToFace } from "../daily/handToFace";
import type { dress } from "../dressing/dress";
import type { gesture } from "../everyday/gesture";
import type { look } from "../everyday/look";
import type { rest } from "../everyday/rest";
import type { typeText } from "../everyday/typeText";
import type { useTool } from "../tasks/useTool";
import type { wipe } from "../tasks/wipe";
import type { selfAction } from "../touch/selfAction";
import type { touch } from "../touch/touch";
import { HumanChainPosture } from "./HumanChainPosture";

/**
 * The chain methods of the hands, the head and the eyes on the body's own
 * support: looking, gesturing, resting the hands, touching, the daily tasks
 * at the face, dressing, and working a tool, a surface, a mechanism or a
 * keyboard.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family and documents each method.
 * @evidence contracts/development/design.md#principled-representation One method per action of the family, each `act` under the action's name.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The upper-body actions only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every method takes its law's own parameter type.
 */
export class HumanChainManual extends HumanChainPosture {
  /**
   * Stand and look at a target, turning the eyes, head and trunk.
   *
   * @param params Target, recruitment, cue and time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public look(params: look.IParams, anchor?: string): this {
    return this.act("look", params, anchor);
  }

  /**
   * Make a communicative gesture of the hands, head or trunk.
   *
   * @param params The gesture and its options.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public gesture(params: gesture.IParams, anchor?: string): this {
    return this.act("gesture", params, anchor);
  }

  /**
   * Stand with the hands at rest places (pockets, hips, crossed arms).
   *
   * @param params Each hand's place and the time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public rest(params: rest.IParams = {}, anchor?: string): this {
    return this.act("rest", params, anchor);
  }

  /**
   * Lay a hand on a partner's or one's own region and move it there by a
   * kind of touch: a tap, a pat, a stroke, a rub, a press, a squeeze, a hold
   * or a scratch.
   *
   * @param params The region, the kind, the part of the hand, the hand and the timing.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public touch(params: touch.IParams, anchor?: string): this {
    return this.act("touch", params, anchor);
  }

  /**
   * Perform a whole-body self action: a stretch, victory arms, a fist pump,
   * a neck or shoulder roll.
   *
   * @param params The kind, the hand and the count.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public selfAction(params: selfAction.IParams, anchor?: string): this {
    return this.act("selfAction", params, anchor);
  }

  /**
   * Perform a hand-to-face task of daily living: drink, eat, phone, read or
   * groom.
   *
   * @param params The task, the hand, the count and the time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public handToFace(params: handToFace.IParams, anchor?: string): this {
    return this.act("handToFace", params, anchor);
  }

  /**
   * Put on a hat or a pair of glasses with both hands.
   *
   * @param params The item.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public dress(params: dress.IParams, anchor?: string): this {
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
  public useTool(params: useTool.IParams, anchor?: string): this {
    return this.act("useTool", params, anchor);
  }

  /**
   * Wipe a level surface with the flat palm in circles.
   *
   * @param params The surface point, the hand and the cycles.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public wipe(params: wipe.IParams, anchor?: string): this {
    return this.act("wipe", params, anchor);
  }

  /**
   * Press a button, turn a knob, slide a drawer or swing a door by its
   * handle.
   *
   * @param params The mechanism and the hand.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public operate(params: operate.IParams, anchor?: string): this {
    return this.act("operate", params, anchor);
  }

  /**
   * Type a text on a keyboard with the index fingertips, holding the current
   * posture.
   *
   * @param params The keyboard and the text.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public typeText(params: typeText.IParams, anchor?: string): this {
    return this.act("typeText", params, anchor);
  }
}
