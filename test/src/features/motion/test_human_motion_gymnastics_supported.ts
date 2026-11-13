import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanGymnastics,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanContactWindow,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A round-off wheels the body over its hands along the way it faced and
 * lands it on both feet facing back: on the average man and on the small
 * woman, leading with either hand, the body is inverted on its hands at
 * the wheel's half, each bearing hand stays where it came down, and the
 * body ends upright on both feet, turned half round, ahead of where it
 * began.
 *
 * The expectations are the figure's common description (a cartwheel along
 * the run that lands on both feet facing back, the entry to a back
 * handspring), for which no source was read, and the campaign's 5 mm bound
 * on a planted support and 15 mm on a contact at its event. The travel's
 * floor of half the stature is provisional: a wheel of straddled legs and
 * wide arms rolls about its own height in a turn, less the turn's closing.
 * Two bodies of opposite build suffice because every place is a share of
 * the body's own lengths.
 *
 * Scenarios, for each of the two bodies, a round-off out of standing on
 * each hand:
 * 1. At `inverted` the head is below the hips and both wrists are within a
 *    tenth of the stature of the floor.
 * 2. Through each hand's declared contact window, read at its start, its
 *    middle and its end, the wrist stays within 5 mm.
 * 3. At the end both soles are within 15 mm of the floor, the head is above
 *    the hips by more than 0.3 of the stature, the hips face back (their
 *    forward axis against the one they began with, -0.99 or less), and the
 *    hips stand more than half the stature ahead along the first heading.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public chain on real bodies and reads displayed joints at the plan's own declared events and windows; a body not inverted, a hand that slides, a landing on one foot or facing on fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The figure's description and the campaign's bounds; the windows are the plan's declarations, which the test holds it to; nothing else is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases Both leading hands on two bodies of opposite build; the inversion, the supports, the two feet, the turn and the travel are separate assertions.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and four short films without props; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the sources and what is provisional, why two bodies suffice and the 3 scenarios.
 */
export function test_human_motion_gymnastics_supported(): void {
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    for (const row of ["roundOffLeft", "roundOffRight"] as const) {
      const label: string = `${name} ${row}`;
      let film: HumanPerformance;
      try {
        film = new HumanPerformance({
          seed: "round-off",
          laws: [HumanGymnastics[row]],
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a")
            .stand({ seconds: 0.3 })
            .registered(row).node,
        });
      } catch (error) {
        complaints.push(
          `${label}: ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
      const reader: HumanSignature.IReader = HumanSignature.of(
        film,
        "a",
        body,
        0,
      );
      const wheel: HumanSegment.ISegment = film
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.name === row)!;
      const at = (share: number): number =>
        wheel.start + share * wheel.plan.duration;
      const joint = (
        seconds: number,
        bone: AutoMovieHumanoidBone,
      ): IAutoMovieVector3 => HumanSignature.joint(reader, seconds, bone);
      const hips = (seconds: number): IAutoMovieVector3 =>
        Vector3.lerp(
          joint(seconds, "leftUpperLeg"),
          joint(seconds, "rightUpperLeg"),
          0.5,
        );

      // 1. Inverted on the hands.
      const half: number = at(
        wheel.plan.events.find((e): boolean => e.name === "inverted")
          ?.share ?? Number.NaN,
      );
      const hung: number = joint(half, "head").y - hips(half).y;
      if (!(hung < 0))
        complaints.push(
          `${label}: at the wheel's half the head is ${hung.toFixed(3)} m above the hips, below them expected`,
        );
      for (const bone of ["leftHand", "rightHand"] as const)
        if (!(joint(half, bone).y <= 0.1 * stature))
          complaints.push(
            `${label}: at the wheel's half the ${bone} is ${joint(half, bone).y.toFixed(3)} m above the floor, ${(0.1 * stature).toFixed(3)} m at most expected`,
          );

      // 2. A bearing hand stays where it came down.
      const hands: IHumanContactWindow[] = wheel.plan.contacts.filter(
        (window: IHumanContactWindow): boolean => window.part.endsWith("Hand"),
      );
      if (hands.length !== 2)
        complaints.push(
          `${label}: ${hands.length} hand supports are declared, one for each hand expected`,
        );
      for (const window of hands) {
        const bone: AutoMovieHumanoidBone =
          window.part as AutoMovieHumanoidBone;
        const down: IAutoMovieVector3 = joint(at(window.from), bone);
        for (const share of [(window.from + window.to) / 2, window.to]) {
          const slid: number =
            1000 *
            Vector3.length(Vector3.subtract(joint(at(share), bone), down));
          if (!(slid <= 5))
            complaints.push(
              `${label}: the bearing ${bone} moves ${slid.toFixed(1)} mm by ${(share * wheel.plan.duration).toFixed(2)} s, 5 mm at most expected`,
            );
        }
      }

      // 3. On both feet, upright, facing back, ahead.
      const end: number = wheel.end;
      for (const side of ["left", "right"] as const) {
        const sole: number = HumanSignature.sole(reader, end, side).y;
        if (!(Math.abs(sole) <= 0.015))
          complaints.push(
            `${label}: at the end the ${side} sole is ${sole.toFixed(3)} m from the floor, within 15 mm expected`,
          );
      }
      const upright: number = joint(end, "head").y - hips(end).y;
      if (!(upright > 0.3 * stature))
        complaints.push(
          `${label}: at the end the head is ${upright.toFixed(3)} m above the hips, more than 0.3 of the stature expected`,
        );
      const facing = (seconds: number): IAutoMovieVector3 =>
        Quaternion.rotateVector(
          HumanSignature.bones(reader, seconds).get("hips")!.worldRotation,
          { x: 0, y: 0, z: 1 },
        );
      const turned: number = Vector3.dot(facing(wheel.start), facing(end));
      if (!(turned <= -0.99))
        complaints.push(
          `${label}: at the end the hips face ${turned.toFixed(3)} along where they faced at the start, -0.99 or less expected`,
        );
      const travelled: number = (hips(end).z - hips(wheel.start).z) / stature;
      if (!(travelled > 0.5))
        complaints.push(
          `${label}: the round-off carries the hips ${travelled.toFixed(2)} of the stature ahead, more than 0.5 expected`,
        );
    }
  }
  TestValidator.equals(
    "a round-off wheels along its run and lands facing back",
    complaints,
    [],
  );
}
