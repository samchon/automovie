import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  HumanSportThrow,
  type IHumanBody,
  type IHumanContactWindow,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A cartwheel wheels the body once to its side over its hands and stands it
 * up again: on the average man and on the small woman, the body is inverted
 * on its hands at the turn's half, each bearing hand stays where it came
 * down, and the body ends upright, facing as it began, more than 0.8 of its
 * stature to its left.
 *
 * The expectations are the figure's common description, for which no
 * source was read (a sideward turn through the handstand with the hands
 * placed one after the other, landing on the feet one after the other),
 * and the campaign's 5 mm bound on a planted support.
 * The travel's floor of 0.8 of the stature is provisional: a wheel whose
 * spokes are the straddled legs and the wide arms rolls about its own
 * height in one turn. Two bodies of opposite build suffice because every
 * quantity is a share of the body's own lengths; one film each keeps the
 * test far under a minute.
 *
 * Scenarios, for each of the two bodies, a cartwheel to the left out of
 * standing:
 * 1. At `inverted` the head is below the hips and both wrists are within a
 *    tenth of the stature of the floor.
 * 2. Through each hand's declared contact window, read at its start, its
 *    middle and its end, the wrist stays within 5 mm.
 * 3. At the end the head is above the hips by more than 0.3 of the
 *    stature, the hips face as they did at the start, and the hips stand
 *    more than 0.8 of the stature to the left of where they began.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a performance through the public chain on real bodies and reads displayed joints at the plan's own declared events and windows; a body that is not inverted, a hand that slides or a landing off its side fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The expectations are the cited description and the campaign's slip bound; the windows are the plan's declarations, which the test holds it to; nothing else is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases The inversion, the two hands' supports and the landing are separate assertions on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and one short film each without props; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the source, what is provisional, why two bodies suffice and the 3 scenarios.
 */
export function test_human_motion_sport_cartwheel(): void {
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    let film: HumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "cartwheel",
        laws: [HumanSportThrow.cartwheelLeft],
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
          .registered("cartwheelLeft")
          .stand({ seconds: 0.3 }).node,
      });
    } catch (error) {
      complaints.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
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
      .find((s: HumanSegment.ISegment): boolean => s.name === "cartwheelLeft")!;
    const at = (share: number): number =>
      wheel.start + share * wheel.plan.duration;
    const joint = (
      seconds: number,
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieVector3 => HumanSignature.joint(reader, seconds, bone);
    const hips = (seconds: number): IAutoMovieVector3 =>
      Vector3.scale(
        Vector3.add(
          joint(seconds, "leftUpperLeg"),
          joint(seconds, "rightUpperLeg"),
        ),
        0.5,
      );

    // 1. Inverted on the hands.
    const half: number = at(
      wheel.plan.events.find((e): boolean => e.name === "inverted")?.share ??
        Number.NaN,
    );
    const hung: number = joint(half, "head").y - hips(half).y;
    if (!(hung < 0))
      complaints.push(
        `${name}: at the turn's half the head is ${hung.toFixed(3)} m above the hips, below them expected`,
      );
    for (const bone of ["leftHand", "rightHand"] as const)
      if (!(joint(half, bone).y <= 0.1 * stature))
        complaints.push(
          `${name}: at the turn's half the ${bone} is ${joint(half, bone).y.toFixed(3)} m above the floor, ${(0.1 * stature).toFixed(3)} m at most expected`,
        );

    // 2. A bearing hand stays where it came down.
    const hands: IHumanContactWindow[] = wheel.plan.contacts.filter(
      (window: IHumanContactWindow): boolean => window.part.endsWith("Hand"),
    );
    if (hands.length !== 2)
      complaints.push(
        `${name}: ${hands.length} hand supports are declared, one for each hand expected`,
      );
    for (const window of hands) {
      const bone: AutoMovieHumanoidBone = window.part as AutoMovieHumanoidBone;
      const down: IAutoMovieVector3 = joint(at(window.from), bone);
      for (const share of [(window.from + window.to) / 2, window.to]) {
        const slid: number =
          1000 * Vector3.length(Vector3.subtract(joint(at(share), bone), down));
        if (!(slid <= 5))
          complaints.push(
            `${name}: the bearing ${bone} moves ${slid.toFixed(1)} mm by ${(share * wheel.plan.duration).toFixed(2)} s of the cartwheel, 5 mm at most expected`,
          );
      }
    }

    // 3. Upright again, facing as before, to the left.
    const end: number = wheel.end;
    const upright: number = joint(end, "head").y - hips(end).y;
    if (!(upright > 0.3 * stature))
      complaints.push(
        `${name}: at the end the head is ${upright.toFixed(3)} m above the hips, more than 0.3 of the stature expected`,
      );
    const facing = (seconds: number): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        HumanSignature.bones(reader, seconds).get("hips")!.worldRotation,
        { x: 0, y: 0, z: 1 },
      );
    const kept: number = Vector3.dot(facing(wheel.start), facing(end));
    if (!(kept >= 0.99))
      complaints.push(
        `${name}: at the end the hips face ${kept.toFixed(3)} along where they faced at the start, 0.99 at least expected`,
      );
    const travelled: number = (hips(end).x - hips(wheel.start).x) / stature;
    if (!(travelled > 0.8))
      complaints.push(
        `${name}: the cartwheel carries the hips ${travelled.toFixed(2)} of the stature to the left, more than 0.8 expected`,
      );
  }
  TestValidator.equals("a cartwheel wheels over the hands", complaints, []);
}
