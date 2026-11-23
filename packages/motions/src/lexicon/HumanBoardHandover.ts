import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBoard,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanMountedFrame } from "./HumanMountedFrame";

/**
 * The hand-over of a boarding's hold on a partner (#3437): a passenger
 * swung up behind a rider takes off holding the rider with one hand, and a
 * hand on the rider's far side would reach around behind the rider's back
 * once the passenger is behind it, the forearm through the rider. The other
 * hand takes the rider's waist on its own side before the first lets go,
 * so a hand holds the rider throughout, as a passenger keeps hold while
 * settling behind a rider.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the defect, the hand-over and why the support stays continuous.
 * @evidence contracts/development/design.md#principled-representation A second hold on the partner and the two instants of the hand-over, read on the boarding's own path.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hand-over record and its planner; the boarding and its holds are `HumanBoard`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The partner's holds are the partner's displayed ones; what holds is the course's own still problem.
 */
export namespace HumanBoardHandover {
  /** A hand-over: the other hand, the waist it takes and the two local seconds. */
  export interface IHandover {
    /** The hand that takes over. */
    side: AutoMovieHumanSide;

    /** The partner's waist it holds: the side of the pelvis on its own side. */
    region: AutoMovieHumanoidRegion;

    /** When it takes its hold, local seconds: the first instant the course's still problem holds both hands. */
    takes: number;

    /** When the first hand lets go, local seconds: the last instant from the taking at which the course's still problem holds both hands. */
    lets: number;
  }

  /** A hand held on a point at an instant. */
  export interface IHold {
    /** The hand. */
    side: AutoMovieHumanSide;

    /** Where it holds, world metres. */
    point: IAutoMovieVector3;
  }

  /** Whether the plan's arms can hold the given holds at a local second, by the course's own still problem. */
  export type Stands = (t: number, holds: readonly IHold[]) => boolean;

  /**
   * Plan the hand-over of a hold on a partner, or none when the first hand
   * holds through the whole flight.
   *
   * @param hand The first hold.
   * @param partner The partner held.
   * @param flight The flight's seconds.
   * @param start The boarding's film second.
   * @param stands Whether the plan's arms can hold at a local second (`AutoMovieMotionHumanArmPlanned.stands`).
   * @returns The hand-over, or none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the two instants and when none is planned.
   * @evidence contracts/development/implementation.md#principled-implementation Every instant is admitted by the course's own still problem (`AutoMovieMotionHumanArmPlanned.stands`), so admission and course agree: the first hand alone until it no longer holds, the other hand taking at the first instant both hold together, the first letting go at the last instant from there both still do.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The first hand's span, then the shared span.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A hand-over no instant of which holds both hands is none; nothing is stretched.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most seventeen still problems of one hand and seventeen of two, on the flight's sixteen even samples.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Run once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a small record.
   */
  export function plan(
    hand: IAutoMovieMotionHumanBoard.IHand,
    partner: IAutoMovieMotionHumanPerformerReader,
    flight: number,
    start: number,
    stands: Stands,
  ): IHandover | undefined {
    // A thigh is held at the waist: the other hand takes the waist on its
    // own side, at the side of the pelvis above the thigh the first hand
    // holds, as a pillion passenger rides holding the rider's waist.
    if (hand.bone !== "leftUpperLeg" && hand.bone !== "rightUpperLeg")
      return undefined;
    const bone: AutoMovieHumanoidBone = hand.bone;
    const side: AutoMovieHumanSide = hand.side === "left" ? "right" : "left";
    const taken: AutoMovieHumanoidRegion =
      side === "left" ? "hipLeft" : "hipRight";
    const sample = (k: number): number => (flight * k) / 16;
    const first = (t: number): IHold => ({
      side: hand.side,
      point: HumanMountedFrame.partnerHold(partner, bone, start + t),
    });
    const other = (t: number): IHold => ({
      side,
      point: waist(partner, taken, start + t),
    });

    // The first hand holds alone until the course no longer holds it there:
    // past it the arm would pass through the partner.
    let alone: number | undefined;
    for (let k: number = 1; k <= 16 && alone === undefined; ++k)
      if (!stands(sample(k), [first(sample(k))])) alone = k - 1;
    if (alone === undefined) return undefined;

    // The other hand takes the partner at the first instant before that at
    // which the course holds both hands, and the first lets go at the last
    // instant from there at which it still does.
    let taking: number | undefined;
    for (let k: number = 0; k <= alone && taking === undefined; ++k)
      if (stands(sample(k), [first(sample(k)), other(sample(k))])) taking = k;
    if (taking === undefined) return undefined;
    let letting: number = taking;
    for (
      let k: number = taking + 1;
      k <= alone && stands(sample(k), [first(sample(k)), other(sample(k))]);
      ++k
    )
      letting = k;
    return {
      side,
      region: taken,
      takes: sample(taking),
      lets: sample(letting),
    };
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
