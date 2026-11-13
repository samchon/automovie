import { createDrinkware } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanSocial,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Four people clink real glasses at one point (#3350: two or more held
 * glasses meet at one shared point).
 *
 * Four average men stand on a circle of 0.45 m about the point, each facing
 * it; each glass starts at its taker's waist height before his right
 * shoulder, 0.3 of the arm ahead, and is picked up for its use. The point is
 * at their chest height.
 *
 * Scenarios, at each role's own `meet`:
 * 1. The toast of four with glasses plans.
 * 2. Each glass's rim, read as the point's distance to the rim's circle,
 *    lies within 15 mm of the shared point (#3350's bound for a shared
 *    contact at its instant).
 * 3. Each glass stands within 10 degrees of upright (#3361).
 *
 * The four rims are asked to the same point, so the glasses overlap there;
 * that is the row's stated first pass and is not read here.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places four real archetypes, joins the cast through the public mutual join and reads displayed prop frames; a glass left at a pair's own midpoint or tipped fails.
 * @evidence contracts/development/testing.md#independent-expectations Both bounds are acceptance lines of #3350 and #3361; the rim is the archetype's own lip affordance and the point the test's own.
 * @evidence contracts/development/testing.md#distinguishing-cases Held glasses at one point; the mimed toast of four is `test_human_motion_social_toast_four`'s and the pair's `test_human_motion_social_toast_*`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and one archetype and builds one four-person performance with four pick-ups; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage, the 3 scenarios with their bounds and what is not read.
 */
export function test_human_motion_social_toast_four_glasses(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const glass: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "glass",
  });
  const at: IAutoMovieVector3 = { x: 0, y: body.measure.chestHeight, z: 0 };
  const cast = [
    ["a", "host", 0],
    ["b", "guest", 180],
    ["c", "third", 90],
    ["d", "fourth", -90],
  ] as const;
  const complaints: string[] = [];

  // A performer's floor frame: 0.45 m from the point, facing it.
  const turn = (yaw: number): IAutoMovieVector3 => ({
    x: Math.sin((yaw * Math.PI) / 180),
    y: 0,
    z: Math.cos((yaw * Math.PI) / 180),
  });
  const stands = (yaw: number): IAutoMovieVector3 =>
    Vector3.scale(turn(yaw), -0.45);

  // Before the right shoulder: the performer's right is his forward turned
  // a quarter to the right.
  const before = (yaw: number): HumanObject.Placement => {
    const ahead: number = 0.3 * (body.measure.upperArm + body.measure.forearm);
    const right: IAutoMovieVector3 = turn(yaw - 90);
    const floor: IAutoMovieVector3 = Vector3.add(
      Vector3.add(stands(yaw), Vector3.scale(turn(yaw), ahead)),
      Vector3.scale(right, body.measure.shoulderHalfWidth),
    );
    return { at: { x: floor.x, y: body.measure.waistHeight, z: floor.z }, yaw };
  };

  // 1. The toast plans.
  let performance: HumanPerformance;
  try {
    const takes = (subject: string): HumanChain =>
      HumanChain.subject(subject).pickUp({
        prop: `glass-${subject}`,
        handle: "body",
        use: { tip: "lip", line: "square" },
      });
    performance = new HumanPerformance({
      seed: "four-glasses",
      laws: [HumanSocial.fistBump],
      props: cast.map(
        ([subject, , yaw]): IHumanProp =>
          HumanObject.prop(`glass-${subject}`, glass, before(yaw)),
      ),
      performers: cast.map(([subject, , yaw]) => ({
        subject,
        body,
        at: stands(yaw),
        yaw,
        proficiency: { level: "trained" as const },
      })),
      composition: HumanChain.mutual(
        HumanSocial.toastOfFour,
        {
          host: takes("a"),
          guest: takes("b"),
          third: takes("c"),
          fourth: takes("d"),
        },
        {
          at,
          glasses: {
            host: "glass-a",
            guest: "glass-b",
            third: "glass-c",
            fourth: "glass-d",
          },
        },
      ).node,
    });
  } catch (error) {
    TestValidator.equals(
      "a toast of four with glasses plans",
      error instanceof Error ? error.message : String(error),
      "",
    );
    return;
  }

  // 2, 3. Every rim at the point, every glass upright.
  const lip: IAutoMovieVector3 = glass.affordance("lip").frame.translation;
  for (const [subject, role] of cast) {
    const placed: HumanSegment.ISegment = performance.segments(subject)[1]!;
    const meet: number =
      placed.start +
      (placed.plan.events.find((e): boolean => e.name === "meet")?.share ??
        NaN) *
        placed.plan.duration;
    const frame: IHumanProp.IFrame = performance.prop(`glass-${subject}`, meet);
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    const from: IAutoMovieVector3 = Vector3.subtract(
      at,
      Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, { x: 0, y: lip.y, z: 0 }),
      ),
    );
    const along: number = Vector3.dot(from, axis);
    const rim: number = Math.hypot(
      Vector3.length(Vector3.subtract(from, Vector3.scale(axis, along))) -
        Math.hypot(lip.x, lip.z),
      along,
    );
    if (!(rim <= 0.015))
      complaints.push(
        `${role}: the glass's rim is ${(rim * 1000).toFixed(1)} mm from the shared point at meet, within 15 mm expected`,
      );
    const tilt: number = (Math.acos(Math.min(1, axis.y)) * 180) / Math.PI;
    if (!(tilt <= 10))
      complaints.push(
        `${role}: the glass tilts ${tilt.toFixed(1)} degrees at meet, within 10 expected`,
      );
  }
  TestValidator.equals("four glasses clinked at one point", complaints, []);
}
