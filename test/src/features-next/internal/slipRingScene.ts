import {
  type AutoMovieArchetype,
  createFingerRing,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGetDressed,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";

import type { motionHumanBody } from "../../features/internal/motionHumanBody";

/**
 * The ring exchange of `test_motion_get_dressed_slip_ring`, staged as that spec
 * stages it: the partner `b` presents a hand, the dresser `a` takes the ring up
 * and slips it on, with switches for the parts a unit leaves out, so the
 * presenting, the pickUp, the slip and the self refusal are units of their
 * own.
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

  /**
   * `b` presents a hand; `a` takes the ring up and slips it on `partner`'s
   * finger.
   */
  export function exchange(
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
    c: ICase,
    partner: string,
  ): HumanPerformance {
    const ring: Ring = createFingerRing({ id: "ring" });
    return new HumanPerformance({
      seed: "slip-ring",
      laws: [
        AutoMovieMotionHumanGetDressed.slipRing,
        AutoMovieMotionHumanGetDressed.presentHand,
      ],
      performers: [
        {
          subject: "a",
          body: a,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: b,
          at: { x: 0, y: 0, z: APART },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      props: [HumanObject.prop("ring", ring, stand(c.side))],

      // The partner presents first, so the dresser reads where the hand is.
      composition: present(c.hand).with(
        HumanChain.subject("a")
          .pickUp({ prop: "ring", handle: "hold", hand: c.side, lift: 0.05 })
          .registered(AutoMovieMotionHumanGetDressed.slipRing.name, {
            prop: "ring",
            partner,
            hand: c.hand,
            side: c.side,
          }),
      ).node,
    });
  }

  /** A point's distance from the line through two points. */
  export function toAxis(
    p: IAutoMovieVector3,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): number {
    const axis: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(b, a));
    const d: IAutoMovieVector3 = Vector3.subtract(p, a);
    return Vector3.length(
      Vector3.subtract(d, Vector3.scale(axis, Vector3.dot(d, axis))),
    );
  }

  /** A prop's position in a displayed bone's frame. */
  export function local(
    prop: IAutoMovieRigidTransform,
    bone: IAutoMovieResolvedBone,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      Quaternion.inverse(bone.worldRotation),
      Vector3.subtract(prop.position, bone.worldPosition),
    );
  }
}
