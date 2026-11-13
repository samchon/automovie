import { createDrinkware } from "@automovie/archetypes";
import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A prop worn on a bone rides that bone, is taken off by a grip and put on
 * again by a law (#3358 item 5): a flask worn at the right hip, the way a
 * holster or a canteen is.
 *
 * The average man wears a glass on his hips bone, 0.22 m to his right and
 * 0.08 m ahead of the hips joint, upright. He bows, picks the glass up from
 * his hip, puts it back on with `putDown`'s `on`, and bows again.
 *
 * Scenarios, read every quarter of a second:
 * 1. Through the first bow the glass keeps its frame in the hips bone's
 *    frame within 1 mm (the campaign's grip bound, a worn prop being a grip
 *    by a bone) while the hips joint moves more than 5 mm.
 * 2. From the pick up's `gripClosed` to the put down's `placed` the glass
 *    keeps its place in the right hand's frame within 1 mm: the grip took
 *    it off the bone.
 * 3. At `placed` the glass lies within 15 mm of the frame it was worn at
 *    (the campaign's contact bound), and from there through the second bow
 *    it keeps its frame in the hips bone's frame within 1 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places a real archetype declared worn, builds the performance through the public chain and reads the displayed prop and bones; a worn prop that stays in the world, a grip that leaves it on the bone or a put on that does not wear it fails.
 * @evidence contracts/development/testing.md#independent-expectations The 1 mm and 15 mm are the campaign's grip and contact bounds; the offset is the test's own.
 * @evidence contracts/development/testing.md#distinguishing-cases Worn from the start, held, and worn again by a law, each over a movement of the bone.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and one archetype and builds one performance; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage and the 3 scenarios with their bounds.
 */
export function test_human_motion_prop_worn(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const glass: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "glass",
  });
  const offset: IHumanProp.IFrame = {
    position: { x: -0.22, y: 0, z: 0.08 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  let performance: HumanPerformance;
  try {
    const placed: IHumanProp = HumanObject.prop("flask", glass, {
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
    });
    performance = new HumanPerformance({
      seed: "worn",
      props: [{ ...placed, worn: { subject: "a", bone: "hips", offset } }],
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
        .gesture({ kind: "bow" })
        .pickUp({ prop: "flask", handle: "body" })
        .putDown({ prop: "flask", on: { bone: "hips", offset } })
        .gesture({ kind: "bow" }).node,
    });
  } catch (error) {
    TestValidator.equals(
      "a worn prop taken off and put on plans",
      error instanceof Error ? error.message : String(error),
      "",
    );
    return;
  }
  const segments: readonly HumanSegment.ISegment[] = performance.segments("a");
  const instant = (index: number, event: string): number =>
    segments[index]!.start +
    (segments[index]!.plan.events.find((e): boolean => e.name === event)
      ?.share ?? NaN) *
      segments[index]!.plan.duration;

  // The glass's frame in a bone's frame.
  const seat = (
    bone: "hips" | "rightHand",
    seconds: number,
  ): IHumanProp.IFrame => {
    const frame: IAutoMovieResolvedBone = performance
      .bones("a", seconds)
      .get(bone)!;
    const prop: IHumanProp.IFrame = performance.prop("flask", seconds);
    const inverse = Quaternion.inverse(frame.worldRotation);
    return {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(prop.position, frame.worldPosition),
      ),
      rotation: Quaternion.multiply(inverse, prop.rotation),
    };
  };
  const drift = (
    bone: "hips" | "rightHand",
    from: number,
    to: number,
  ): number => {
    const first: IAutoMovieVector3 = seat(bone, from).position;
    let worst: number = 0;
    for (let seconds: number = from; seconds <= to + 1e-9; seconds += 0.25)
      worst = Math.max(
        worst,
        Vector3.length(
          Vector3.subtract(seat(bone, Math.min(seconds, to)).position, first),
        ),
      );
    return worst;
  };

  // 1. Worn through the first bow.
  const bowed: number = drift("hips", 0, segments[0]!.end);
  if (!(bowed <= 0.001))
    complaints.push(
      `the worn glass moves ${mm(bowed)} mm in the hips' frame through the first bow, within 1 mm expected`,
    );
  const hips = (seconds: number): IAutoMovieVector3 =>
    performance.bones("a", seconds).get("hips")!.worldPosition;
  let swing: number = 0;
  for (let seconds: number = 0; seconds <= segments[0]!.end; seconds += 0.25)
    swing = Math.max(
      swing,
      Vector3.length(Vector3.subtract(hips(seconds), hips(0))),
    );
  if (!(swing > 0.005))
    complaints.push(
      `the hips joint moves only ${mm(swing)} mm through the bow, more than 5 mm expected for the scenario to read anything`,
    );

  // 2. Held between the grip and the put on.
  const gripped: number = instant(1, "gripClosed") + 1e-3;
  const put: number = instant(2, "placed");
  const held: number = drift("rightHand", gripped, put - 1e-3);
  if (!(held <= 0.001))
    complaints.push(
      `the glass moves ${mm(held)} mm in the hand's frame while held, within 1 mm expected`,
    );

  // 3. Worn again.
  const back: number = Vector3.length(
    Vector3.subtract(seat("hips", put).position, offset.position),
  );
  if (!(back <= 0.015))
    complaints.push(
      `at placed the glass lies ${mm(back)} mm from the frame it was worn at, within 15 mm expected`,
    );
  const again: number = drift("hips", put + 1e-3, performance.duration);
  if (!(again <= 0.001))
    complaints.push(
      `the glass worn again moves ${mm(again)} mm in the hips' frame through the second bow, within 1 mm expected`,
    );
  TestValidator.equals("a prop worn on a bone", complaints, []);
}
