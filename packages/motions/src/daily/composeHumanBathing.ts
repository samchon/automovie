import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

/**
 * Bathing composed from shipped actions (#3995): getting into and out of a
 * bathtub, washing under a shower and drying with a towel. Each appends
 * shipped step-over, sit, rise, operate, touch and pickup actions, so they are
 * fitted, refused and checked as those actions are.
 *
 * - Into the tub: step over its rim, then sit on its floor seat; out by
 *   rising and stepping over the rim again.
 * - Shower: turn the tap's knob on, scrub the scalp with both hands, the
 *   face and each forearm with the other hand, then turn it off.
 * - Towel: take the towel and rub it over the scalp with both hands.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each act and its order.
 * @evidence contracts/development/design.md#principled-representation Each act is data over shipped actions targeting the fixture's named parts and the body's regions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the compositions the bathroom scenes use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No posture is authored here; the composed actions plan and refuse.
 */
export namespace composeHumanBathing {
  /** Rubbing strokes for each washed region (provisional). */
  export const SCRUBS: number = 4;

  /** The tap knob's turn to open the water, degrees (provisional, a quarter turn). */
  export const TAP_TURN: number = 90;

  /**
   * Step over the tub's rim and sit on its floor seat.
   *
   * @param chain The bather's chain.
   * @param tub The tub's subject, the obstacle stepped over.
   * @param seat The tub's floor seat.
   * @returns The chain with the entry appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order.
   * @evidence contracts/development/implementation.md#principled-implementation The shipped step-over of the tub, then the shipped sit on its floor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two appends.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The composed actions plan and refuse.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two appends.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function intoTub<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    tub: string,
    seat: IAutoMovieMotionHumanSeated.ISeat,
  ): Chain {
    return chain.act("stepOver", { obstacle: tub }).act("sit", { seat });
  }

  /**
   * Rise from the tub's floor and step out over its rim.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order.
   * @evidence contracts/development/implementation.md#principled-implementation The shipped rise, then the shipped step-over of the tub.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two appends.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The composed actions plan and refuse.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two appends.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function outOfTub<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    tub: string,
  ): Chain {
    return chain.act("rise", {}).act("stepOver", { obstacle: tub });
  }

  /**
   * Shower: open the tap, wash the scalp, the face and both forearms, close the tap.
   *
   * @param chain The bather's chain.
   * @param tap The tap knob.
   * @returns The chain with the wash appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order of the strokes.
   * @evidence contracts/development/implementation.md#principled-implementation The shipped knob turn on and off around rubbing touches on the crown, the face and each forearm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Six appends in washing order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The composed actions plan and refuse.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Six appends.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function shower<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    tap: IAutoMovieMotionTarget,
  ): Chain {
    const scrub = (
      current: Chain,
      side: AutoMovieHumanSide,
      region: "face" | "forearmLeft" | "forearmRight",
    ): Chain =>
      current.act("touch", {
        target: { kind: "self", region },
        side,
        kind: "rub",
        count: SCRUBS,
      });
    const opened: Chain = chain.act("operate", {
      mechanism: { kind: "knob", at: tap, turn: TAP_TURN },
    });
    const scalp: Chain = opened.act("touch", {
      target: { kind: "self", region: "crown" },
      other: { kind: "self", region: "crown" },
      kind: "rub",
      count: SCRUBS,
    });
    const washed: Chain = scrub(
      scrub(scrub(scalp, "right", "face"), "right", "forearmLeft"),
      "left",
      "forearmRight",
    );
    return washed.act("operate", {
      mechanism: { kind: "knob", at: tap, turn: -TAP_TURN },
    });
  }

  /**
   * Take the towel and dry the scalp with it in both hands.
   *
   * @param chain The bather's chain.
   * @param towel The towel's subject.
   * @param handle The towel's grip.
   * @returns The chain with the drying appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order.
   * @evidence contracts/development/implementation.md#principled-implementation The shipped pickup, then a two-handed rub on the crown with the held towel.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two appends.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The composed actions plan and refuse.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two appends.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function towelDry<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    towel: string,
    handle: string,
  ): Chain {
    return chain
      .act("pickUp", { prop: towel, handle, hand: "right" })
      .act("touch", {
        target: { kind: "self", region: "crown" },
        other: { kind: "self", region: "crown" },
        kind: "rub",
        prop: towel,
        count: SCRUBS,
      });
  }
}
