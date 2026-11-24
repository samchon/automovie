import {
  type AutoMovieArchetype,
  createFingerRing,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChain,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { AutoMovieMotionHumanGetDressed, HumanChain } from "@automovie/motions";

import type { motionHumanBody } from "./motionHumanBody";

/**
 * The ring exchange's staging from `test_motion_get_dressed_slip_ring`, as that
 * spec stages it: its two exchanges, the ring's stand and the partner's
 * presentation, so `test_motion_action_pick_up` takes the ring up from the same
 * stand and `test_motion_action_present_hand` presents the same hands.
 */
export namespace slipRingScene {
  /** A ring model. */
  export type Ring = AutoMovieArchetype<
    createFingerRing.Affordance,
    createFingerRing.Dimension
  >;

  /** One ring exchange: who gives, who receives, and with which hands. */
  export interface ICase {
    /** The dresser's body. */
    dresser: motionHumanBody.Name;

    /** The partner's body. */
    partner: motionHumanBody.Name;

    /** The dresser's ring hand. */
    side: AutoMovieHumanSide;

    /** The partner's presented hand. */
    hand: AutoMovieHumanSide;
  }

  /** The original's two exchanges, the mirrored hands. */
  export const CASES: readonly ICase[] = [
    { dresser: "m-average", partner: "f-small", side: "right", hand: "left" },
    { dresser: "f-small", partner: "m-average", side: "left", hand: "right" },
  ];

  /**
   * How far apart the two stand, metres (staging: the presented hand before the
   * dresser, clear of the dresser's hips; provisional).
   */
  export const APART: number = 0.75;

  /**
   * The ring on its stand ahead of the ring hand, between the two, as the
   * original places it.
   */
  export function stand(side: AutoMovieHumanSide): IAutoMovieRigidTransform {
    return {
      position: { x: (side === "right" ? -1 : 1) * 0.25, y: 1.1, z: 0.3 },
      rotation: Quaternion.identity(),
    };
  }

  /** `b`'s presentation of its hand, held 8 s, as the original. */
  export function present(
    hand: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanChain {
    return HumanChain.subject("b").registered(
      AutoMovieMotionHumanGetDressed.presentHand.name,
      { side: hand, hold: 8 },
    );
  }
}
