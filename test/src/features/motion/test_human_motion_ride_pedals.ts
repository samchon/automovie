import { createBicycle, rideBicycle } from "@automovie/archetypes";
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
 * A cyclist's feet go round with the pedals: each foot stays on its pedal
 * while the crank turns it, the seat stays on the saddle, and a foot told
 * to stay on a point the bicycle does not have is refused.
 *
 * Scenarios, the average man on a bicycle that goes 10 m straight at 4 m/s
 * after standing 6 s while he mounts, the ride given the pedals as the
 * points the feet stay on:
 * 1. Mounting and the ride plan.
 * 2. Over one turn of the crank, from one top dead centre of the left arm
 *    to the next as the bicycle's own ride publishes them, read at nine
 *    instants, the ball of each foot stays within 10 mm of where it rested
 *    against its pedal where the pedal is then, in the bicycle's own axes
 *    (the campaign's bound for a held contact).
 * 3. Over that turn the left ankle's height above the bicycle's root varies
 *    by at least 0.25 m: a pedal travels a circle of twice the crank's
 *    length, 0.33 to 0.35 m for the 165 to 175 mm cranks road bicycles
 *    carry, and the floor leaves room for nine instants missing its top and
 *    bottom (provisional).
 * 4. At those instants the seat region stays within 10 mm of where it sat
 *    in the bicycle's own frame.
 * 5. A ride whose left foot is to stay on `leftStirrup` is refused as an
 *    `affordance` refusal on `feet` that lists the bicycle's points.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Rides a real bicycle archetype whose crank turns with the distance and reads the displayed feet against the pedals and the seat against the frame; feet left where the pedals stood at rest, a seat pulled off the saddle by the legs, or an unknown point accepted fails.
 * @evidence contracts/development/testing.md#independent-expectations Where a pedal is comes from the archetype's own ride, the 10 mm is the campaign's bound and the circle is the crank's geometry; none is read from the ride law. Limitation: the foot's pitch on the pedal (ankling) and the knees' track are not read.
 * @evidence contracts/development/testing.md#distinguishing-cases The feet that must move with the pedals against the seat that must not, and a point the bicycle has against one it lacks.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and one archetype ride in memory and reads nine instants of one crank turn, an eighth of it apart, which shows the whole circle: one body, since the claim is the relation between the feet and the pedals of whoever rides.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 5 scenarios with their bounds and sources.
 */
export function test_human_motion_ride_pedals(): void {
  const complaints: string[] = [];
  const WAIT: number = 6;
  const body: IHumanBody = motionHumanBody("m-average");
  const bicycle: ReturnType<typeof createBicycle> = createBicycle({});
  const cycling: ReturnType<typeof rideBicycle> = rideBicycle(bicycle, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 10 }],
    cruise: 4,
    acceleration: 1.5,
    deceleration: 2,
  });
  const known: Map<number, IHumanProp.IFrame> = new Map();
  const placed = (seconds: number): IHumanProp.IFrame => {
    const kept: IHumanProp.IFrame | undefined = known.get(seconds);
    if (kept !== undefined) return kept;
    const placement: IAutoMovieTransform = cycling.at(
      Math.max(0, seconds - WAIT),
    ).placement;
    const frame: IHumanProp.IFrame = {
      position: placement.translation,
      rotation: placement.rotation,
    };
    known.set(seconds, frame);
    return frame;
  };

  // Where one of the bicycle's contacts is in the world at a film second: the pedals turn on the crank.
  const part = (id: string, seconds: number): IAutoMovieTransform =>
    cycling.frame(
      id as Parameters<typeof cycling.frame>[0],
      Math.max(0, seconds - WAIT),
    );
  const seat: seated.ISeat = HumanObject.seat(bicycle, placed(0));
  const perform = (left: string): HumanPerformance =>
    new HumanPerformance({
      seed: "pedals",
      laws: [HumanRide.ride],
      props: [HumanObject.prop("bicycle", bicycle, placed(0), placed, part)],
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
          on: "bicycle",
          seconds: WAIT + cycling.duration,
          feet: { left, right: "rightPedal" },
        }).node,
    });

  // 5. A point the bicycle does not have.
  let thrown: unknown = null;
  try {
    perform("leftStirrup");
  } catch (error) {
    thrown = error;
  }
  if (
    !(
      thrown instanceof HumanRefusal &&
      thrown.kind === "affordance" &&
      thrown.axis === "feet" &&
      thrown.feasible?.kind === "alternatives" &&
      thrown.feasible.values.includes("leftPedal")
    )
  )
    complaints.push(
      `a foot on a stirrup of a bicycle: expected an affordance refusal on feet listing the bicycle's points, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
    );

  // 1 to 4. The feet go round; the seat stays.
  let performance: HumanPerformance | null = null;
  try {
    performance = perform("leftPedal");
  } catch (error) {
    complaints.push(
      `pedalling: ${error instanceof Error ? error.message : String(error)}`,
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

    // A world point from a place of the bicycle, in the bicycle's own axes.
    const local = (
      world: IAutoMovieVector3,
      from: IAutoMovieVector3,
      seconds: number,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(Quaternion.inverse(placed(seconds).rotation), {
        x: world.x - from.x,
        y: world.y - from.y,
        z: world.z - from.z,
      });
    const ball = (side: "left" | "right", t: number): IAutoMovieVector3 =>
      local(
        HumanFoot.sockets(body, HumanSignature.bones(reader, t), side).find(
          (s: HumanFoot.ISocket): boolean => s.socket === "ball",
        )!.point,
        part(`${side}Pedal`, t).translation,
        t,
      );
    const tops: number[] = cycling.instants
      .filter(
        (i: { label: string }): boolean => i.label === "leftTopDeadCentre",
      )
      .map((i: { seconds: number }): number => WAIT + i.seconds)
      .filter(
        (s: number): boolean =>
          s >= ride.entryTime + 0.3 && s <= ride.end - 0.3,
      );
    const from: number | undefined = tops[(tops.length - 1) >> 1];
    const to: number | undefined = tops[((tops.length - 1) >> 1) + 1];
    if (from === undefined || to === undefined)
      complaints.push(
        `pedalling: the ride holds ${tops.length} top dead centres of the left crank arm, a whole turn between two expected`,
      );
    else {
      const sat: IAutoMovieVector3 = local(
        HumanSignature.region(reader, "seat", from),
        placed(from).position,
        from,
      );
      const stood: Record<"left" | "right", IAutoMovieVector3> = {
        left: ball("left", from),
        right: ball("right", from),
      };
      let lowest: number = Infinity;
      let highest: number = -Infinity;
      for (let k: number = 0; k <= 8; ++k) {
        const t: number = from + (k / 8) * (to - from);
        const seatNow: IAutoMovieVector3 = local(
          HumanSignature.region(reader, "seat", t),
          placed(t).position,
          t,
        );
        const slid: number = Math.hypot(
          seatNow.x - sat.x,
          seatNow.y - sat.y,
          seatNow.z - sat.z,
        );
        if (slid > 0.01)
          complaints.push(
            `pedalling: the seat is ${(slid * 1000).toFixed(1)} mm from where it sat at ${t.toFixed(2)} s, within 10 mm expected`,
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
              `pedalling: the ${side} foot's ball is ${(moved * 1000).toFixed(1)} mm from its place on the pedal at ${t.toFixed(2)} s, within 10 mm expected`,
            );
        }
        const ankle: number = local(
          HumanSignature.joint(reader, t, "leftFoot"),
          placed(t).position,
          t,
        ).y;
        lowest = Math.min(lowest, ankle);
        highest = Math.max(highest, ankle);
      }
      if (highest - lowest < 0.25)
        complaints.push(
          `pedalling: the left ankle's height varies ${(highest - lowest).toFixed(3)} m over a turn of the crank, at least 0.250 m expected`,
        );
    }
  }
  TestValidator.equals("a cyclist's feet go round", complaints, []);
}
