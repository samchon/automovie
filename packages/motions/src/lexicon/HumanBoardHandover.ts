import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
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

import { HumanArmObstacleBones } from "../posture/HumanArmObstacleBones";
import { HumanColliders } from "../posture/HumanColliders";
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

    /** The partner's waist it holds: the side of the pelvis on its own side. */
    region: AutoMovieHumanoidRegion;

    /** When it takes its hold, local seconds: the first instant its arm's own fit places it on its hold with the forearm clear, at or before the first hand lets go. */
    takes: number;

    /** When the first hand lets go, local seconds: the first instant its arm would pass through the partner's trunk. */
    lets: number;
  }

  /**
   * Plan the hand-over of a hold on a partner, or none when the first hand
   * never comes to pass through the partner's trunk over the flight.
   *
   * @param body The boarding body.
   * @param hand The first hold.
   * @param partner The partner held.
   * @param flight The flight's seconds.
   * @param start The boarding's film second.
   * @param boarding The boarding posture at a local second, without its holding hands.
   * @returns The hand-over, or none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the two instants and when none is planned.
   * @evidence contracts/development/implementation.md#principled-implementation The first hand lets go at the first of the flight's even samples at which its arm, the segment from the boarding posture's shoulder to the wrist a hand's length short of its hold, tapered from the upper arm's radius to the forearm's, reaches inside the partner's displayed trunk colliders (`HumanColliders.distanceToSegment`), and the other hand takes its hold at the first sample before that at which its arm's own fit places it there with the forearm clear (`HumanUnseatPose.placeable`), the still problem the course solves.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The letting go, then the taking.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A hand-over the other hand cannot take before the first lets go is none; nothing is stretched.
   * @evidence contracts/development/implementation.md#efficient-algorithms Sixteen samples of the flight, each one shoulder resolve, one hold read and one segment distance to the partner's trunk, then at most seventeen arm fits: the boarding's own sampling of its hold's release.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Run once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a small record.
   */
  export function plan(
    body: IAutoMovieMotionHumanBody,
    hand: IAutoMovieMotionHumanBoard.IHand,
    partner: IAutoMovieMotionHumanPerformerReader,
    flight: number,
    start: number,
    boarding: (t: number) => IAutoMovieMotionHumanPosture,
  ): IHandover | undefined {
    // A thigh is held at the waist: the other hand takes the waist on its
    // own side, as a pillion passenger rides holding the rider's waist, at
    // the back of it (the kidney's region), the side of the waist away from
    // the thigh the first hand holds in front, so the two hands' arms keep
    // apart while both hold.
    if (hand.bone !== "leftUpperLeg" && hand.bone !== "rightUpperLeg")
      return undefined;
    const side: AutoMovieHumanSide = hand.side === "left" ? "right" : "left";
    const taken: AutoMovieHumanoidRegion =
      side === "left" ? "kidneyLeft" : "kidneyRight";

    // The first hand lets go as its arm, the line from its shoulder to its
    // wrist a hand short of its hold, widened by the arm's radii, would pass
    // through the partner's displayed trunk.
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    let lets: number | undefined;
    for (let k: number = 0; k <= 16 && lets === undefined; ++k) {
      const t: number = (flight * k) / 16;
      const shoulder: IAutoMovieVector3 = HumanUnseatPose.shoulder(
        body,
        boarding(t),
        hand.side,
      );
      const hold: IAutoMovieVector3 = HumanMountedFrame.partnerHold(
        partner,
        hand.bone,
        start + t,
      );
      const reach: number = Vector3.distance(shoulder, hold);
      const wrist: IAutoMovieVector3 =
        reach <= m.hand
          ? shoulder
          : Vector3.addScaled(
              shoulder,
              Vector3.subtract(hold, shoulder),
              (reach - m.hand) / reach,
            );
      if (
        HumanColliders.distanceToSegment(
          partner.body,
          partner.bones(start + t, HumanArmObstacleBones.TRUNK),
          shoulder,
          wrist,
          [m.upperArmRadius, m.forearmRadius],
        ).distance < 0
      )
        lets = t;
    }
    if (lets === undefined) return undefined;

    // The other hand takes the rider on its own side before that.
    const takes: number | undefined = HumanUnseatPose.placeable(
      body,
      side,
      0,
      lets,
      boarding,
      (t: number): IAutoMovieVector3 => waist(partner, taken, start + t),
    );
    return takes === undefined
      ? undefined
      : { side, region: taken, takes, lets };
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
