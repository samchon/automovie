import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanBalance,
  HumanChain,
  HumanPartner,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A judo throw's first half (`HumanPartner.judoThrow`): the thrower takes
 * the collar and sleeve grip while the receiver's base is broken forward,
 * the body tipped over the toes with the feet still down. What follows is
 * the force-determined follow-up's (#3439).
 *
 * Two average men face each other 0.6 m apart and join the throw after a
 * 0.3 s stand.
 *
 * Scenarios:
 * 1. The joined throw plans.
 * 2. At the middle of the receiver's held tip his centre of mass lies
 *    outside the hull of his feet (`HumanBalance.margin` negative): the
 *    base is broken. Before the throw it lies inside.
 * 3. At that instant his centre of mass lies ahead of his toes toward the
 *    thrower, and his hips joint has moved toward the thrower.
 * 4. Through the tip his toes' joints stay within 5 mm of where they
 *    stood (the campaign's bound for a planted support): the feet do not
 *    step.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Joins two performers through the public mutual join and reads the displayed joints, the centre of mass and the posture's balance margin; a lean that keeps the balance, a tip away from the thrower or feet that step fail.
 * @evidence contracts/development/testing.md#independent-expectations A base is broken when the centre of mass leaves the feet's hull, which is the definition, read by the package's balance owner; the 5 mm is the campaign's bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Before the throw against the held tip; the receiver against the thrower.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds one two-person performance; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage, what is left to the follow-up and the 4 scenarios with their bounds.
 */
export function test_human_motion_partner_judo(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(0);

  // 1. It plans.
  let performance: HumanPerformance;
  try {
    performance = new HumanPerformance({
      seed: "judo",
      laws: [HumanPartner.judoGrip, HumanPartner.judoBroken],
      performers: (["t", "u"] as const).map((subject: "t" | "u") => ({
        subject,
        body,
        at: { x: 0, y: 0, z: subject === "t" ? 0 : 0.6 },
        yaw: subject === "t" ? 0 : 180,
        proficiency: { level: "trained" as const },
      })),
      composition: HumanChain.mutual(HumanPartner.judoThrow, {
        tori: HumanChain.subject("t").stand({ seconds: 0.3 }),
        uke: HumanChain.subject("u").stand({ seconds: 0.3 }),
      }).node,
    });
  } catch (error) {
    TestValidator.equals(
      "a judo throw plans",
      error instanceof Error ? error.message : String(error),
      "",
    );
    return;
  }
  const broken: HumanSegment.ISegment = performance.segments("u")[1]!;
  const at = (event: string): number =>
    broken.start +
    (broken.plan.events.find((e): boolean => e.name === event)?.share ?? NaN) *
      broken.plan.duration;
  const held: number = (at("broken") + at("relax")) / 2;
  const reader: HumanSignature.IReader = HumanSignature.of(
    performance,
    "u",
    body,
    0,
  );

  // 2. Outside the feet.
  const before: number = HumanBalance.margin(
    body,
    performance.posture("u", 0.1),
  );
  const during: number = HumanBalance.margin(
    body,
    performance.posture("u", held),
  );
  if (!(before > 0))
    complaints.push(
      `before the throw the receiver's balance margin is ${mm(before)} mm, inside his feet expected`,
    );
  if (!(during < 0))
    complaints.push(
      `at the held tip the receiver's balance margin is ${mm(during)} mm, outside his feet expected`,
    );

  // 3. Toward the thrower (he faces -Z).
  const centre: IAutoMovieVector3 = HumanSignature.centre(reader, held);
  const toes: number = Math.min(
    HumanSignature.joint(reader, held, "leftToes").z,
    HumanSignature.joint(reader, held, "rightToes").z,
  );
  if (!(centre.z < toes))
    complaints.push(
      `at the held tip the receiver's centre of mass lies ${mm(centre.z - toes)} mm behind his toes, ahead of them toward the thrower expected`,
    );
  const moved: number =
    HumanSignature.joint(reader, broken.start, "hips").z -
    HumanSignature.joint(reader, held, "hips").z;
  if (!(moved > 0))
    complaints.push(
      `the receiver's hips moved ${mm(moved)} mm toward the thrower, forward expected`,
    );

  // 4. The feet stay.
  for (const bone of ["leftToes", "rightToes"] as const) {
    let worst: number = 0;
    const from: IAutoMovieVector3 = HumanSignature.joint(
      reader,
      broken.start,
      bone,
    );
    for (
      let seconds: number = broken.start;
      seconds <= broken.end;
      seconds += 0.1
    ) {
      const here: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        seconds,
        bone,
      );
      worst = Math.max(
        worst,
        Math.hypot(here.x - from.x, here.y - from.y, here.z - from.z),
      );
    }
    if (!(worst <= 0.005))
      complaints.push(
        `the receiver's ${bone} joint moves ${mm(worst)} mm through the tip, within 5 mm expected`,
      );
  }
  TestValidator.equals("a judo throw's broken base", complaints, []);
}
