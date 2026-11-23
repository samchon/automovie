import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBathing,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

/**
 * Bathing (`IAutoMovieMotionHumanBathing`) composed from shipped actions:
 * getting into and out of a bathtub, washing under a shower and drying with a
 * towel. Each appends shipped step-over, sit, rise, operate, touch and pickup
 * actions, so they are fitted, refused and checked as those actions are.
 *
 * - Into the tub: step over its apron onto its floor, turn along the tub and sit
 *   on its floor with the legs long; out by stepping over the apron from inside
 *   onto the floor outside.
 * - Shower: turn the tap's knob on, scrub the scalp with both hands, the face and
 *   each forearm with the other hand, then turn it off.
 * - Towel: take the towel and rub it over the scalp with both hands.
 */
export namespace AutoMovieMotionHumanBathing {
  /** Rubbing strokes for each washed region (provisional). */
  export const SCRUBS: number = 4;

  /**
   * The tap knob's turn to open the water, degrees (provisional, a quarter
   * turn).
   */
  export const TAP_TURN: number = 90;

  /** Seconds the bather stays sitting in the tub (provisional). */
  export const SOAK: number = 3;

  /**
   * Step over the tub's apron onto its floor, turn along the tub with a few
   * steps on that floor, and sit down on it with the legs long, as one sits in
   * a bath.
   *
   * @param chain The bather's chain, standing before the tub's apron.
   * @param params The `tub` (the obstacle stepped over and the floor walked
   *   on), the `floor` surface inside the apron where both feet land, the
   *   sitting place `at` in world metres and the `face` heading in degrees
   *   about +Y, along the tub.
   * @returns The chain with the entry appended.
   */
  export function intoTub<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    params: IAutoMovieMotionHumanBathing.IIntoTub,
  ): Chain {
    return chain
      .act("stepOver", {
        obstacle: params.tub,
        onto: { prop: params.tub, point: params.floor },
      })
      .act("walk", {
        to: params.at,
        facing: { yaw: params.face },
        on: { prop: params.tub },
      })
      .act("lieDown", { kind: "sitLong", hold: SOAK });
  }

  /**
   * Step out of the tub over its apron, from standing on its floor facing the
   * apron, onto the floor outside, such as a bath mat.
   *
   * @param chain The bather's chain, standing in the tub facing the apron.
   * @param params The `tub` stepped over from inside and the level surface
   *   `onto` outside it both feet land on.
   * @returns The chain with the exit appended.
   */
  export function outOfTub<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    params: IAutoMovieMotionHumanBathing.IOutOfTub,
  ): Chain {
    return chain.act("stepOver", { obstacle: params.tub, onto: params.onto });
  }

  /**
   * Shower: open the tap, wash the scalp, the face and both forearms, close the
   * tap.
   *
   * @param chain The bather's chain.
   * @param params The `tap` knob.
   * @returns The chain with the wash appended.
   */
  export function shower<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    params: IAutoMovieMotionHumanBathing.IShower,
  ): Chain {
    const tap = params.tap;
    const scrub = (
      current: Chain,
      side: AutoMovieHumanSide,
      region: IAutoMovieMotionHumanBathing.IWashed,
    ): Chain =>
      current.act("touch", {
        target: { kind: "self", region },
        hand: side,
        kind: "rub",
        count: SCRUBS,
      });
    const opened: Chain = chain.act("operate", {
      kind: { kind: "knob", at: tap, turn: TAP_TURN },
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
      kind: { kind: "knob", at: tap, turn: -TAP_TURN },
    });
  }

  /**
   * Take the towel and dry the scalp with it in both hands.
   *
   * @param chain The bather's chain.
   * @param params The `towel` subject and its `handle` grip.
   * @returns The chain with the drying appended.
   */
  export function towelDry<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    params: IAutoMovieMotionHumanBathing.ITowelDry,
  ): Chain {
    const towel: string = params.towel;
    return chain
      .act("pickUp", { prop: towel, handle: params.handle, hand: "right" })
      .act("touch", {
        target: { kind: "self", region: "crown" },
        other: { kind: "self", region: "crown" },
        kind: "rub",
        prop: towel,
        count: SCRUBS,
      });
  }
}
