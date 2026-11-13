import { createHorse, rideHorse } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFoot,
  HumanFrame,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanRide,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanProp,
  type seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A rider rising to the trot stands in the stirrups and sits again once a
 * stride: the seat leaves the saddle and comes back while the feet stay on
 * their stirrups, and a rider with no stirrup to stand in is refused.
 *
 * Scenarios, the average man on a horse that trots 10 m at 3.5 m/s, its
 * stride time given to the ride as 0.6 s (Robilliard, Pfau and Wilson 2007
 * measure 0.60 s at that speed):
 * 1. Mounting, a rising ride of the whole course and getting off plan.
 * 2. Over one stride after the ride has settled, read at nine instants in
 *    the horse's own frame, the body's seat region rises at least a tenth
 *    of the rider's thigh length above where it sat and is back within
 *    15 mm of it at the stride's end (the campaign's bound for a contact at
 *    its event; the tenth is a provisional floor for "rises").
 * 3. At those instants the ball of each foot stays within 10 mm of where it
 *    rested in the horse's frame (the campaign's bound for a held contact).
 * 4. On the same saddle read without its stirrups, a rising ride is refused
 *    as an `affordance` refusal on `rising` that offers riding seated.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Rides a real horse archetype at a trot and reads the displayed seat region and feet in the horse's frame; a rider glued to the saddle, feet that leave the stirrups, or a rising trot accepted with nothing to stand in fails.
 * @evidence contracts/development/testing.md#independent-expectations That a rising trot lifts the seat and keeps the feet is what rising is; the bounds are the campaign's and the stride time the cited measurement. Limitation: the rise is not checked against the horse's diagonals, because the ride takes its period from the composition until a prop can publish its footfalls.
 * @evidence contracts/development/testing.md#distinguishing-cases The seat that must move against the feet that must not, and the saddle with and without stirrups.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and one archetype ride in memory and reads nine instants: one body, since the claim is the relation between the seat and the feet of whoever rides.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds and sources.
 */
export function test_human_motion_ride_rising(): void {
  const complaints: string[] = [];
  const WAIT: number = 6;
  const STRIDE: number = 0.6;
  const body: IHumanBody = motionHumanBody("m-average");
  const horse: ReturnType<typeof createHorse> = createHorse({});
  const trotting: ReturnType<typeof rideHorse> = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      legs: [{ kind: "straight", length: 10 }],
      cruise: 3.5,
      acceleration: 1.5,
      deceleration: 1.5,
    },
    "trot",
  );
  const known: Map<number, IHumanProp.IFrame> = new Map();
  const placed = (seconds: number): IHumanProp.IFrame => {
    const kept: IHumanProp.IFrame | undefined = known.get(seconds);
    if (kept !== undefined) return kept;
    const placement: IAutoMovieTransform = trotting.at(
      Math.max(0, seconds - WAIT),
    ).placement;
    const frame: IHumanProp.IFrame = {
      position: placement.translation,
      rotation: placement.rotation,
    };
    known.set(seconds, frame);
    return frame;
  };
  const saddle: seated.ISeat = HumanObject.seat(horse, placed(0));
  const perform = (seat: seated.ISeat): HumanPerformance =>
    new HumanPerformance({
      seed: "rising",
      laws: [HumanRide.ride],
      props: [HumanObject.prop("horse", horse, placed(0), placed)],
      performers: [
        {
          subject: "a",
          body,
          at: HumanFrame.point(
            { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
            { x: 0.6, y: 0, z: -0.2 },
          ),
          yaw: seat.yaw,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .sit({ seat, seconds: 0.5 })
        .registered("ride", {
          on: "horse",
          seconds: WAIT + trotting.duration,
          rising: STRIDE,
        })
        .rise().node,
    });

  // 4. Nothing to stand in.
  const { footrests: _stirrups, ...bare }: seated.ISeat = saddle;
  let thrown: unknown = null;
  try {
    perform(bare);
  } catch (error) {
    thrown = error;
  }
  if (
    !(
      thrown instanceof HumanRefusal &&
      thrown.kind === "affordance" &&
      thrown.axis === "rising"
    )
  )
    complaints.push(
      `a rising ride without stirrups: expected an affordance refusal on rising, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
    );

  // 1 to 3. The seat rises and returns; the feet stay.
  let performance: HumanPerformance | null = null;
  try {
    performance = perform(saddle);
  } catch (error) {
    complaints.push(
      `a rising ride: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (performance !== null) {
    const ride: HumanSegment.ISegment = performance.segments("a")[1]!;
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );
    const local = (world: IAutoMovieVector3, seconds: number): IAutoMovieVector3 => {
      const frame: IHumanProp.IFrame = placed(seconds);
      return Quaternion.rotateVector(Quaternion.inverse(frame.rotation), {
        x: world.x - frame.position.x,
        y: world.y - frame.position.y,
        z: world.z - frame.position.z,
      });
    };
    const ball = (side: "left" | "right", t: number): IAutoMovieVector3 =>
      local(
        HumanFoot.sockets(body, HumanSignature.bones(reader, t), side).find(
          (s: HumanFoot.ISocket): boolean => s.socket === "ball",
        )!.point,
        t,
      );

    // A whole number of strides into the ride, past the blend from sitting: the seat is down at each stride's start.
    const from: number = ride.entryTime + 2 * STRIDE;
    const sat: IAutoMovieVector3 = local(
      HumanSignature.region(reader, "seat", from),
      from,
    );
    const stood: Record<"left" | "right", IAutoMovieVector3> = {
      left: ball("left", from),
      right: ball("right", from),
    };
    let rose: number = 0;
    for (let k: number = 0; k <= 8; ++k) {
      const t: number = from + (k / 8) * STRIDE;
      const seat: IAutoMovieVector3 = local(
        HumanSignature.region(reader, "seat", t),
        t,
      );
      rose = Math.max(rose, seat.y - sat.y);
      if (k === 8 && Math.hypot(seat.x - sat.x, seat.y - sat.y, seat.z - sat.z) > 0.015)
        complaints.push(
          `a rising ride: at the stride's end the seat is ${(Math.hypot(seat.x - sat.x, seat.y - sat.y, seat.z - sat.z) * 1000).toFixed(1)} mm from where it sat, within 15 mm expected`,
        );
      for (const side of ["left", "right"] as const) {
        const now: IAutoMovieVector3 = ball(side, t);
        const moved: number = Math.hypot(
          now.x - stood[side].x,
          now.y - stood[side].y,
          now.z - stood[side].z,
        );
        if (moved > 0.01)
          complaints.push(
            `a rising ride: the ${side} foot's ball is ${(moved * 1000).toFixed(1)} mm from its place on the stirrup at ${t.toFixed(2)} s, within 10 mm expected`,
          );
      }
    }
    if (rose < 0.1 * body.measure.thigh)
      complaints.push(
        `a rising ride: the seat rises ${(rose * 1000).toFixed(1)} mm over a stride, at least ${(100 * body.measure.thigh).toFixed(1)} mm expected`,
      );
  }
  TestValidator.equals("a rider rises to the trot", complaints, []);
}
