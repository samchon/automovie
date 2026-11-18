import { createBoat, rowBoat } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFrame,
  HumanObject,
  HumanPerformance,
  HumanRide,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** An oar contact's largest displayed wrist separation and when it occurred. */
interface IHandleGap {
  gap: number;
  at: number;
  wrist?: IAutoMovieVector3;
  handle?: IAutoMovieVector3;
}

/** One authored instant of the boat's ride. */
type BoatInstant = ReturnType<typeof rowBoat>["instants"][number];

/**
 * A rower's hands stay on the oar handles through the stroke, on still
 * water and on a swell: the handles sweep from the catch, far forward over
 * the knees, to the finish at the chest, and the trunk leans forward to the
 * catch to reach them (a fixed-seat rower's thorax is inclined about 49
 * degrees forward at the catch, Agius et al. 2023, Bioengineering 10:774).
 *
 * The ride is told the rowing thwart, the one the oarlocks stand beside
 * (BoatOars' geometry), and that each hand holds its oar's handle. The
 * rower first stands on the boat's floor, so the thwart's height is read
 * from that floor (`seated.floor`). Each scenario waits 6 s in which the
 * boat lies still while the rower sits and takes hold, then rows 20 m
 * straight.
 *
 * Scenarios, on the average man and the small woman, on still water and on
 * a slight sea (significant height 1 m, seed 7):
 * 1. At every catch the ride names (`catch<k>`), and halfway between each
 *    catch and the next, each wrist is within 0.7 of the hand's length of
 *    its handle there (the bound `test_human_motion_ride_grips` holds a
 *    grip to; the palm's middle lies about half a hand from the wrist).
 * 2. From the displayed ride entry to the first named catch, the neck
 *    moves ahead of the hips along the rower's seated forward axis by at
 *    least a tenth of the trunk's length. Agius et al. establish the
 *    direction. The size is provisional.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Rows a real archetype boat and reads the displayed wrists against the handles' own frames at the stroke's named instants; hands left behind at the catch, or a trunk that does not lean to the catch, fail.
 * @evidence contracts/development/testing.md#independent-expectations The boat supplies both handle frames and the rower's local forward axis. The 0.7 hand is the grips spec's bound, and Agius et al. establish the flexion direction. The ride entry precedes the hand's take and supplies the comparison posture.
 * @evidence contracts/development/testing.md#distinguishing-cases Still water and a swell, two bodies of opposite build, every catch and every mid-stroke.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds four rides in memory; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the two scenarios and their bounds.
 */
export function test_human_motion_ride_rowing(): void {
  const complaints: string[] = [];
  const WAIT: number = 6;
  const boat: ReturnType<typeof createBoat> = createBoat(
    { kind: "rowboat" },
    2,
  );
  const affordances: readonly IAutoMovieAffordance[] = boat.affordances ?? [];
  const along = (id: string): number =>
    affordances.find((a: IAutoMovieAffordance): boolean => a.id === id)!.frame
      .translation.z;
  const oarlocks: number = (along("leftOarlock") + along("rightOarlock")) / 2;
  const thwart: string = affordances
    .filter((a: IAutoMovieAffordance): boolean => /^thwart\d$/.test(a.id))
    .reduce((a: IAutoMovieAffordance, b: IAutoMovieAffordance) =>
      Math.abs(b.frame.translation.z - oarlocks) <
      Math.abs(a.frame.translation.z - oarlocks)
        ? b
        : a,
    ).id;
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(
    affordances.find((a: IAutoMovieAffordance): boolean => a.id === thwart)!.frame.rotation,
    { x: 0, y: 0, z: 1 },
  );
  for (const water of ["still", "swell"] as const) {
    const ride: ReturnType<typeof rowBoat> = rowBoat(
      boat,
      {
        start: { x: 0, z: 0, heading: 0 },
        legs: [{ kind: "straight", length: 20 }],
        cruise: 1.5,
        acceleration: 0.5,
        deceleration: 0.5,
      },
      water === "swell" ? { sea: { height: 1, seed: 7 } } : {},
    );
    for (const name of ["m-average", "f-small"] as const) {
      const label: string = `${name} on ${water} water`;
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
      const placed = (seconds: number): IAutoMovieRigidTransform => {
        const placement: IAutoMovieTransform = ride.at(
          Math.max(0, seconds - WAIT),
        ).placement;
        return {
          position: placement.translation,
          rotation: placement.rotation,
        };
      };
      const part = (id: string, seconds: number): IAutoMovieTransform =>
        ride.frame(
          id as Parameters<typeof ride.frame>[0],
          Math.max(0, seconds - WAIT),
        );
      const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
        boat,
        placed(0),
        thwart,
      );
      // The rower stands on the boat's floor before sitting, so the thwart
      // is measured from that floor (`seated.floor`), on the swell too.
      const floor: IAutoMovieVector3 = Quaternion.rotateVector(
        placed(0).rotation,
        affordances.find(
          (a: IAutoMovieAffordance): boolean => a.id === "floor",
        )!.frame.translation,
      );
      const standing: IAutoMovieVector3 = HumanFrame.point(
        { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
        { x: 0, y: 0, z: 0.4 },
      );
      let performance: IAutoMovieMotionHumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "rowing",
          laws: [HumanRide.ride],
          props: [HumanObject.prop("boat", boat, placed(0), placed, part)],
          performers: [
            {
              subject: "a",
              body,
              at: { ...standing, y: placed(0).position.y + floor.y },
              yaw: seat.yaw,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a")
            .stand({ seconds: 0.3, on: { prop: "boat" } })
            .sit({ seat, seconds: 0.5 })
            .registered("ride", {
              on: "boat",
              seat: thwart,
              seconds: WAIT + ride.duration,
              hands: { left: "leftHandle", right: "rightHandle" },
            }).node,
        });
      } catch (error) {
        complaints.push(
          `${label}: ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
      const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
        performance,
        "a",
        body,
        0,
      );

      // 1. The wrists on the handles at each catch and halfway to the next.
      const catches: number[] = ride.instants
        .filter((i: BoatInstant): boolean => /^catch\d+$/.test(i.label))
        .map((i: BoatInstant): number => WAIT + i.seconds);
      if (catches.length === 0)
        complaints.push(`${label}: the ride names no catch`);
      const instants: number[] = catches.flatMap(
        (t: number, k: number): number[] =>
          k + 1 < catches.length ? [t, (t + catches[k + 1]!) / 2] : [t],
      );
      const neckAhead = (frame: ReturnType<typeof HumanSignature.bones>, t: number): number => {
        const neck: IAutoMovieVector3 = frame.get("neck")!.worldPosition;
        const hips: IAutoMovieVector3 = frame.get("hips")!.worldPosition;
        const local: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.inverse(placed(t).rotation),
          Vector3.subtract(neck, hips),
        );
        return Vector3.dot(local, forward);
      };
      const worst: Record<AutoMovieHumanSide, IHandleGap> = {
        left: { gap: 0, at: 0 },
        right: { gap: 0, at: 0 },
      };
      let firstCatch: number | undefined;
      for (const t of instants) {
        const frame: ReturnType<typeof HumanSignature.bones> = HumanSignature.bones(reader, t);
        if (t === catches[0]) firstCatch = neckAhead(frame, t);
        for (const side of ["left", "right"] as const) {
          const wrist: IAutoMovieVector3 = frame.get(`${side}Hand`)!.worldPosition;
          const handle: IAutoMovieVector3 = part(
            `${side}Handle`,
            t,
          ).translation;
          const gap: number = Math.hypot(
            wrist.x - handle.x,
            wrist.y - handle.y,
            wrist.z - handle.z,
          );
          if (gap > worst[side].gap)
            worst[side] = { gap, at: t, wrist, handle };
        }
      }
      const missedGoals: Map<number, IAutoMovieMotionHumanPosture["limbs"]> = new Map();
      for (const side of ["left", "right"] as const) {
        const miss: IHandleGap = worst[side];
        if (!(miss.gap <= 0.7 * body.measure.hand)) {
          complaints.push(
            `${label}: the ${side} wrist is ${(miss.gap * 1000).toFixed(0)} mm from its handle at ${miss.at.toFixed(2)} s, within ${(700 * body.measure.hand).toFixed(0)} mm expected`,
          );
          // The displayed rule above decides the verdict. Diagnose a
          // missed goal only at the instant already observed to fail.
          let goals: IAutoMovieMotionHumanPosture["limbs"] | undefined =
            missedGoals.get(miss.at);
          if (goals === undefined) {
            goals = performance.posture("a", miss.at).limbs;
            missedGoals.set(miss.at, goals);
          }
          const goal: IAutoMovieHumanLimbGoal | undefined =
            goals[`${side}Arm`];
          if (goal !== undefined && miss.wrist !== undefined && miss.handle !== undefined)
            complaints.push(
              `${label}: the ${side} arm goal is ${(1000 * Vector3.length(Vector3.subtract(goal.point, miss.handle))).toFixed(0)} mm from its handle and ${(1000 * Vector3.length(Vector3.subtract(goal.point, miss.wrist))).toFixed(0)} mm from the displayed wrist`,
            );
        }
      }

      // The boat's rest time can already show the handles in catch position.
      // Only the displayed entry into this ride is still the seated pose.
      if (firstCatch !== undefined) {
        const trunk: number =
          body.measure.shoulderHeight - body.measure.hipHeight;
        const entry: IAutoMovieMotionHumanSegment | undefined =
          performance.segments("a").find((span: IAutoMovieMotionHumanSegment): boolean => span.name === "ride");
        if (entry === undefined) {
          complaints.push(`${label}: the film contains no placed ride`);
          continue;
        }
        const upright: number = neckAhead(
          HumanSignature.bones(reader, entry.entryTime),
          entry.entryTime,
        );
        const lean: number = firstCatch - upright;
        if (!(lean >= 0.1 * trunk))
          complaints.push(
            `${label}: at the first catch the neck lies ${(lean * 1000).toFixed(0)} mm further forward than the ride entry, at least ${(100 * trunk).toFixed(0)} mm expected (Agius et al. 2023)`,
          );
      }
    }
  }
  TestValidator.equals("a rower's hands stay on the handles", complaints, []);
}
