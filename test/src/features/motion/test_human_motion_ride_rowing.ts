import { createBoat, rowBoat } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
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
  type IHumanBody,
  type IHumanProp,
  type seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

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
 * 2. At the first catch the trunk leans forward of where it sits upright
 *    at the end of the 6 s: the neck lies further toward the bow than the
 *    hips by at least a tenth of the trunk's length (the direction is Agius
 *    et al.'s; the size is provisional).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Rows a real archetype boat and reads the displayed wrists against the handles' own frames at the stroke's named instants; hands left behind at the catch, or a trunk that does not lean to the catch, fail.
 * @evidence contracts/development/testing.md#independent-expectations Where a handle is comes from the boat's own ride; the 0.7 hand is the grips spec's bound and the lean's direction Agius et al.'s.
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
      const body: IHumanBody = motionHumanBody(name);
      const placed = (seconds: number): IHumanProp.IFrame => {
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
      const seat: seated.ISeat = HumanObject.seat(boat, placed(0), thwart);
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
      let performance: HumanPerformance;
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
      const reader: HumanSignature.IReader = HumanSignature.of(
        performance,
        "a",
        body,
        0,
      );

      // 1. The wrists on the handles at each catch and halfway to the next.
      const catches: number[] = ride.instants
        .filter((i: { label: string }): boolean => /^catch\d+$/.test(i.label))
        .map((i: { seconds: number }): number => WAIT + i.seconds);
      if (catches.length === 0)
        complaints.push(`${label}: the ride names no catch`);
      const instants: number[] = catches.flatMap(
        (t: number, k: number): number[] =>
          k + 1 < catches.length ? [t, (t + catches[k + 1]!) / 2] : [t],
      );
      for (const side of ["left", "right"] as const) {
        let worst: { gap: number; at: number } = { gap: 0, at: 0 };
        for (const t of instants) {
          const wrist: IAutoMovieVector3 = HumanSignature.joint(
            reader,
            t,
            `${side}Hand`,
          );
          const handle: IAutoMovieVector3 = part(
            `${side}Handle`,
            t,
          ).translation;
          const gap: number = Math.hypot(
            wrist.x - handle.x,
            wrist.y - handle.y,
            wrist.z - handle.z,
          );
          if (gap > worst.gap) worst = { gap, at: t };
        }
        if (!(worst.gap <= 0.7 * body.measure.hand))
          complaints.push(
            `${label}: the ${side} wrist is ${(worst.gap * 1000).toFixed(0)} mm from its handle at ${worst.at.toFixed(2)} s, within ${(700 * body.measure.hand).toFixed(0)} mm expected`,
          );
      }

      // 2. The trunk leans to the first catch.
      if (catches.length > 0) {
        const bow = (t: number): number => {
          const neck: IAutoMovieVector3 = HumanSignature.joint(
            reader,
            t,
            "neck",
          );
          const hips: IAutoMovieVector3 = HumanSignature.joint(
            reader,
            t,
            "hips",
          );
          // Toward the bow: the rower faces the stern, so the bow lies behind the seat's heading.
          const local: IAutoMovieVector3 = Quaternion.rotateVector(
            Quaternion.inverse(placed(t).rotation),
            { x: neck.x - hips.x, y: neck.y - hips.y, z: neck.z - hips.z },
          );
          return local.z;
        };
        const trunk: number =
          body.measure.shoulderHeight - body.measure.hipHeight;
        const upright: number = bow(WAIT);
        const leant: number = bow(catches[0]!);
        const ahead: number = Math.sign(along("bow") - along("stern"));
        const lean: number = ahead * (leant - upright);
        if (!(lean >= 0.1 * trunk))
          complaints.push(
            `${label}: at the first catch the neck lies ${(lean * 1000).toFixed(0)} mm further toward the bow than upright, at least ${(100 * trunk).toFixed(0)} mm expected (Agius et al. 2023)`,
          );
      }
    }
  }
  TestValidator.equals("a rower's hands stay on the handles", complaints, []);
}
