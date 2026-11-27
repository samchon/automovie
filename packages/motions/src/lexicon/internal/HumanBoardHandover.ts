
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, AutoMovieHumanoidRegion, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanBoard, IAutoMovieMotionHumanPerformerReader, IAutoMovieVector3 } from "@automovie/interface";

import { HumanMountedFrame } from "./HumanMountedFrame";

/*
 * The hand-over of a boarding's hold on a partner: a passenger swung up behind
 * a rider takes off holding the rider with one hand, and a hand on the rider's
 * far side would reach around behind the rider's back once the passenger is
 * behind it, the forearm through the rider. The other hand takes the rider's
 * waist on its own side before the first lets go, so a hand holds the rider
 * throughout, as a passenger keeps hold while settling behind a rider.
 */
export namespace HumanBoardHandover {
  /*
   * A hand-over: the other hand, the waist it takes and the two local seconds.
   */
  export interface IHandover {
    /*
     * The hand that takes over.
     */
    side: AutoMovieHumanSide;

    /*
     * The partner's waist it holds: the side of the pelvis on its own side.
     */
    region: AutoMovieHumanoidRegion;

    /*
     * When it takes its hold, local seconds: the first instant the course's
     * still problem holds both hands.
     */
    takes: number;

    /*
     * When the first hand lets go, local seconds: the last instant from the
     * taking at which the course's still problem holds both hands.
     */
    lets: number;
  }

  /*
   * A hand held on a point at an instant.
   */
  export interface IHold {
    /*
     * The hand.
     */
    side: AutoMovieHumanSide;

    /*
     * Where it holds, world metres.
     */
    point: IAutoMovieVector3;
  }

  /*
   * Whether the plan's arms can hold the given holds at a local second, by the
   * course's own still problem.
   */
  export type Stands = (t: number, holds: readonly IHold[]) => boolean;

  /*
   * Plan the hand-over of a hold on a partner, or none when the first hand
   * holds through the whole flight.
   * Parameter hand: The first hold.
   * Parameter partner: The partner held.
   * Parameter flight: The flight's seconds.
   * Parameter start: The boarding's film second.
   * Parameter stands: Whether the plan's arms can hold at a local second
   * (`AutoMovieMotionHumanArmPlanned.stands`).
   * Returns: The hand-over, or none.
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
  /*
   * The partner's waist a hand holds, on the partner's displayed body.
   * Parameter partner: The partner held.
   * Parameter region: The side of the pelvis held.
   * Parameter film: The film second.
   * Returns: The region's surface point, world metres.
   */
  export function waist(
    partner: IAutoMovieMotionHumanPerformerReader,
    region: AutoMovieHumanoidRegion,
    film: number,
  ): IAutoMovieVector3 {
    const frame: IAutoMovieHumanoidSurfaces.IFrame =
      partner.body.surfaces.regions[region];
    return AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
      frame,
      partner
        .bones(film, new Set<AutoMovieHumanoidBone>([frame.bone]))
        .get(frame.bone)!,
    ).point;
  }
}
