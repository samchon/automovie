import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBoard,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanUnseatPose } from "./HumanUnseatPose";

/**
 * The hand-over of a boarding's hold on a partner (#3437): a passenger
 * swung up behind a rider takes off holding the rider with one hand, and a
 * hand on the rider's far side would reach around behind the rider's back
 * once the passenger is behind it, the forearm through the rider. The other
 * hand takes the rider's waist on its own side before the first lets go, so a hand holds the rider throughout, as a passenger keeps hold
 * while settling behind a rider.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the defect, the hand-over and why the support stays continuous.
 * @evidence contracts/development/design.md#principled-representation A second hold on the partner and the two instants of the hand-over, read on the boarding's own path.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hand-over record and its planner; the boarding and its holds are `HumanBoard`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The partner's trunk and holds are the partner's displayed ones; the shoulder is the boarding posture's own.
 */
export namespace HumanBoardHandover {
  /** A hand-over: the other hand, the waist it takes and the two local seconds. */
  export interface IHandover {
    /** The hand that takes over. */
    side: AutoMovieHumanSide;

    /** The partner's waist it holds: the back of it on its own side. */
    region: AutoMovieHumanoidRegion;

    /** When it takes its hold, local seconds: the first instant its arm's own fit places it on its hold with the forearm clear, at or before the first hand lets go. */
    takes: number;

    /** When the first hand lets go, local seconds: the last instant its arm's own fit still places it on its hold clear of both trunks. */
    lets: number;
  }

  /**
   * Plan the hand-over of a hold on a partner, or none when the first hand's
   * arm still places it on its hold, clear, through the whole flight.
   *
   * @param body The boarding body.
   * @param hand The first hold.
   * @param partner The partner held.
   * @param flight The flight's seconds.
   * @param start The boarding's film second.
   * @param holding The plan's posture at a local second with a hand's goal on a point, as the plan writes a hold on the partner (its rests with it).
   * @returns The hand-over, or none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the two instants and when none is planned.
   * @evidence contracts/development/implementation.md#principled-implementation The first hand lets go at the last of the flight's even samples at which the plan's own fit of its hold still places it there (`HumanUnseatPose.placed`), and the other hand takes its hold at the first sample before that at which the plan's fit places it on the waist (`HumanUnseatPose.placeable`): the still problem the course solves, the same goals, rests and clearances.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The letting go, then the taking.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A hand-over the other hand cannot take before the first lets go is none; nothing is stretched.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most sixteen arm fits for the letting go and seventeen for the taking: the boarding's own sampling of its hold's release.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Run once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a small record.
   */
  export function plan(
    body: IAutoMovieMotionHumanBody,
    hand: IAutoMovieMotionHumanBoard.IHand,
    partner: IAutoMovieMotionHumanPerformerReader,
    flight: number,
    start: number,
    holding: (
      t: number,
      side: AutoMovieHumanSide,
      point: IAutoMovieVector3,
    ) => IAutoMovieMotionHumanPosture,
  ): IHandover | undefined {
    // A thigh is held at the waist: the other hand takes the waist on its
    // own side, at the side of the pelvis above the thigh the first hand
    // holds, as a pillion passenger rides holding the rider's waist. The
    // back of the waist lies between the two bodies once the passenger sits
    // close behind, where the plan's own fit cannot lay a hand until after
    // the first must let go.
    if (hand.bone !== "leftUpperLeg" && hand.bone !== "rightUpperLeg")
      return undefined;
    const side: AutoMovieHumanSide = hand.side === "left" ? "right" : "left";
    const taken: AutoMovieHumanoidRegion =
      side === "left" ? "hipLeft" : "hipRight";

    // The first hand lets go at the last instant the plan's own fit of its
    // hold still places it there, its arm clear of the body and resting on
    // the partner (`HumanUnseatPose.placed`), the still problem the course
    // solves: past it the arm would pass through the partner.
    let lets: number | undefined;
    for (let k: number = 1; k <= 16 && lets === undefined; ++k) {
      const t: number = (flight * k) / 16;
      const point: IAutoMovieVector3 = HumanMountedFrame.partnerHold(
        partner,
        hand.bone,
        start + t,
      );
      if (
        !HumanUnseatPose.placed(
          body,
          hand.side,
          holding(t, hand.side, point),
          point,
        )
      )
        lets = (flight * (k - 1)) / 16;
    }
    if (lets === undefined) return undefined;

    // The other hand takes the rider on its own side before that.
    const at = (t: number): IAutoMovieVector3 =>
      waist(partner, taken, start + t);
    const takes: number | undefined = HumanUnseatPose.placeable(
      body,
      side,
      0,
      lets,
      (t: number): IAutoMovieMotionHumanPosture => holding(t, side, at(t)),
      at,
    );
    if (takes === undefined) return undefined;

    // While both hold, the plan fits both arms at once, each clear of the
    // other: the first lets go at the last instant from the taking at which
    // that fit still places both hands, never after it alone would.
    const first = (t: number): IAutoMovieVector3 =>
      HumanMountedFrame.partnerHold(partner, hand.bone!, start + t);
    let shared: number = takes;
    for (let k: number = Math.ceil((takes * 16) / flight); k <= 16; ++k) {
      const t: number = (flight * k) / 16;
      if (t > lets + 1e-9) break;
      const one: IAutoMovieMotionHumanPosture = holding(t, hand.side, first(t));
      const other: IAutoMovieMotionHumanPosture = holding(t, side, at(t));
      const both: IAutoMovieMotionHumanPosture = {
        ...other,
        limbs: {
          ...other.limbs,
          [`${hand.side}Arm`]: one.limbs[`${hand.side}Arm`]!,
        },
      };
      if (
        !HumanUnseatPose.placed(body, hand.side, both, first(t)) ||
        !HumanUnseatPose.placed(body, side, both, at(t))
      )
        break;
      shared = t;
    }
    return { side, region: taken, takes, lets: shared };
  }

  /**
   * The partner's waist a hand holds, on the partner's displayed body.
   *
   * @param partner The partner held.
   * @param region The side of the pelvis held.
   * @param film The film second.
   * @returns The region's surface point, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the region, the body it is read on and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The body's own surface region placed on its displayed bone (`resolveAutoMovieHumanoidSurfaces.place`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bone read, one placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The partner is read where displayed at the second; no point is invented.
   * @evidence contracts/development/implementation.md#efficient-algorithms One demanded bone a call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function waist(
    partner: IAutoMovieMotionHumanPerformerReader,
    region: AutoMovieHumanoidRegion,
    film: number,
  ): IAutoMovieVector3 {
    const frame: IAutoMovieHumanoidSurfaces.IFrame =
      partner.body.surfaces.regions[region];
    return resolveAutoMovieHumanoidSurfaces.place(
      frame,
      partner
        .bones(film, new Set<AutoMovieHumanoidBone>([frame.bone]))
        .get(frame.bone)!,
    ).point;
  }
}
