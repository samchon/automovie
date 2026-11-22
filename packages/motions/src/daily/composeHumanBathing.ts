import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanCrossing,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Bathing composed from shipped actions (#3995): getting into and out of a
 * bathtub, washing under a shower and drying with a towel. Each appends
 * shipped step-over, sit, rise, operate, touch and pickup actions, so they are
 * fitted, refused and checked as those actions are.
 *
 * - Into the tub: step over its apron onto its floor, turn along the tub
 *   and sit on its floor with the legs long; out by stepping over the apron from inside onto the floor outside.
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

  /** Seconds the bather stays sitting in the tub (provisional). */
  export const SOAK: number = 3;

  /** A region one hand scrubs with the other. */
  export type Washed = "face" | "forearmLeft" | "forearmRight";

  /**
   * Step over the tub's apron onto its floor, turn along the tub with a few
   * steps on that floor, and sit down on it with the legs long, as one sits
   * in a bath.
   *
   * @param chain The bather's chain, standing before the tub's apron.
   * @param tub The tub's subject, the obstacle stepped over and the floor walked on.
   * @param floor The tub's floor surface inside the apron, where both feet land.
   * @param at Where on the tub's floor the bather sits, world metres.
   * @param face The heading the bather sits facing, degrees about +Y: along the tub.
   * @returns The chain with the entry appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order, the place and the heading.
   * @evidence contracts/development/implementation.md#principled-implementation The shipped step-over landing on the tub's floor, the shipped walk on the tub as its support to the place and heading, then the shipped long sit on that floor (`lieDown` sitting long).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three appends.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The composed actions plan and refuse.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three appends.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function intoTub<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    tub: string,
    floor: string,
    at: IAutoMovieVector3,
    face: number,
  ): Chain {
    return chain
      .act("stepOver", { obstacle: tub, onto: { prop: tub, point: floor } })
      .act("walk", { to: at, face, on: { prop: tub } })
      .act("lieDown", { position: "sitLong", hold: SOAK });
  }

  /**
   * Step out of the tub over its apron, from standing on its floor facing
   * the apron, onto the floor outside, such as a bath mat.
   *
   * @param chain The bather's chain, standing in the tub facing the apron.
   * @param tub The tub's subject, the obstacle stepped over from inside.
   * @param onto The level surface outside the tub both feet land on.
   * @returns The chain with the exit appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the starting stance and the landing.
   * @evidence contracts/development/implementation.md#principled-implementation The shipped step-over of the apron read from inside (`HumanObstacle`), landing on the named surface (`onto`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One append.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The composed action plans and refuses.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One append.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function outOfTub<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    tub: string,
    onto: IAutoMovieMotionHumanCrossing.ISurface,
  ): Chain {
    return chain.act("stepOver", { obstacle: tub, onto });
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
      region: Washed,
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
