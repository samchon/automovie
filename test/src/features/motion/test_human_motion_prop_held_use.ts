import {
  createDevice,
  createDrinkware,
} from "@automovie/archetypes";
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
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A hand-to-face task is performed with the object the hand holds: a person
 * picks a glass up and drinks from its rim, picks a phone up and holds its
 * screen to the ear (#3358, #3361, #3346). The objects are archetypes, read through `HumanObject.prop`.
 *
 * Scenarios, the glass on the small woman and the average man and the rest
 * on the average man (a pick-up for a use costs seconds to plan, and a
 * second stature adds nothing to a refusal), each object standing
 * at waist height before the right shoulder, 0.6 of the arm's length ahead:
 * 1. Drinking from a held glass: through the hold at the mouth the glass's
 *    rim passes within 15 mm of the mouth region (#3361's acceptance for
 *    the rim), read as the mouth's distance to the rim's circle.
 * 2. A held phone at the ear: the screen's centre lies within 15 mm of the
 *    right ear region at `atEar`.
 * 3. In each, from the grip's closing to the end of a stand that follows
 *    the task, the object stays where it was in the hand's own frame within
 *    1 mm (the campaign's bound for a grip).
 * 4. Refused, each naming its axis: the drink with a glass that still
 *    stands on the table (`prop`: the hand does not hold it), and a held
 *    glass asked for a point it does not have (`point`, listing the glass's
 *    points).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places real archetypes, builds performances through the public chain and reads the displayed prop frame, hand and face regions; a hand that goes to the face for an implied tool while the glass misses the mouth, a prop that slides in the hand or an unheld prop carried along fails.
 * @evidence contracts/development/testing.md#independent-expectations The rim and the screen are the archetypes' own affordances; 15 mm and 1 mm are the acceptance bounds of #3361 and #3358.
 * @evidence contracts/development/testing.md#distinguishing-cases A vessel and a flat device; two statures; two refusals on different axes. The glass's uprightness and the held cigarette are `test_human_motion_prop_held_attitude`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and two archetypes and builds short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds and sources.
 */
export function test_human_motion_prop_held_use(): void {
  const complaints: string[] = [];
  const glass: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "glass",
  });
  const phone: ReturnType<typeof createDevice> = createDevice({
    kind: "phone",
  });
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const name of ["f-small", "m-average"] as const) {
    const body: IHumanBody = motionHumanBody(name);

    // Before the right shoulder (the body's right is the world's -X at yaw 0).
    const stood: HumanObject.Placement = {
      at: {
        x: -body.measure.shoulderHalfWidth,
        y: body.measure.waistHeight,
        z: 0.6 * (body.measure.upperArm + body.measure.forearm),
      },
      yaw: 0,
    };
    const perform = (
      prop: IHumanProp,
      composition: HumanChain,
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "held",
        props: [prop],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: composition.node,
      });
    const instant = (segment: HumanSegment.ISegment, event: string): number =>
      segment.start +
      (segment.plan.events.find((e): boolean => e.name === event)?.share ??
        NaN) *
        segment.plan.duration;

    // A point of a prop's own space in the world at a second.
    const world = (
      performance: HumanPerformance,
      subject: string,
      seconds: number,
      local: IAutoMovieVector3,
    ): IAutoMovieVector3 => {
      const frame: IHumanProp.IFrame = performance.prop(subject, seconds);
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, local),
      );
    };

    // 3. The prop's origin in the holding hand's frame, from the grip on.
    const drift = (performance: HumanPerformance, subject: string): number => {
      const from: number = instant(performance.segments("a")[0]!, "gripClosed");
      const seat = (seconds: number): IAutoMovieVector3 => {
        const hand: IAutoMovieResolvedBone = performance
          .bones("a", seconds)
          .get("rightHand")!;
        return Quaternion.rotateVector(
          Quaternion.inverse(hand.worldRotation),
          Vector3.subtract(
            performance.prop(subject, seconds).position,
            hand.worldPosition,
          ),
        );
      };
      const first: IAutoMovieVector3 = seat(from + 1e-3);
      let worst: number = 0;
      for (
        let seconds: number = from + 1e-3;
        seconds <= performance.duration;
        seconds += 0.5
      )
        worst = Math.max(
          worst,
          Vector3.length(Vector3.subtract(seat(seconds), first)),
        );
      return worst;
    };
    const tasks: [
      string,
      IHumanProp,
      () => HumanChain,
      (performance: HumanPerformance) => void,
    ][] = [
      [
        "glass",
        HumanObject.prop("glass", glass, stood),
        (): HumanChain =>
          HumanChain.subject("a")
            .pickUp({
          prop: "glass",
          handle: "body",
          use: { tip: "lip", line: "square", at: "mouth" },
        })
            .handToFace({ task: "drink", prop: "glass" })
            .stand({ seconds: 0.5 }),
        (performance: HumanPerformance): void => {
          // 1. The rim at the mouth through the hold.
          const drink: HumanSegment.ISegment = performance.segments("a")[1]!;
          const reader: HumanSignature.IReader = HumanSignature.of(
            performance,
            "a",
            body,
            0,
          );
          const lip: IAutoMovieVector3 =
            glass.affordance("lip").frame.translation;
          const radius: number = Math.hypot(lip.x, lip.z);
          let rim: number = 0;
          const from: number = instant(drink, "atMouth");
          const to: number = instant(drink, "relax");
          for (let i: number = 0; i <= 2; i++) {
            const seconds: number = from + ((to - from) * i) / 2;
            const centre: IAutoMovieVector3 = world(
              performance,
              "glass",
              seconds,
              { x: 0, y: lip.y, z: 0 },
            );
const axis: IAutoMovieVector3 = Quaternion.rotateVector(
              performance.prop("glass", seconds).rotation,
              { x: 0, y: 1, z: 0 },
            );
            const mouth: IAutoMovieVector3 = Vector3.subtract(
              HumanSignature.region(reader, "mouth", seconds),
              centre,
            );
            const along: number = Vector3.dot(mouth, axis);
            const across: number = Vector3.length(
              Vector3.subtract(mouth, Vector3.scale(axis, along)),
            );
            rim = Math.max(rim, Math.hypot(across - radius, along));

          }
          if (!(rim <= 0.015))
            complaints.push(
              `${name}: the held glass's rim is ${mm(rim)} mm from the mouth at its farthest in the hold, within 15 mm expected`,
            );

        },
      ],
      [
        "phone",
        HumanObject.prop("phone", phone, stood),
        (): HumanChain =>
          HumanChain.subject("a")
            .pickUp({ prop: "phone", handle: "grip" })
            .handToFace({ task: "phone", prop: "phone", seconds: 1 })
            .stand({ seconds: 0.5 }),
        (performance: HumanPerformance): void => {
          // 2. The screen at the ear.
          const seconds: number = instant(
            performance.segments("a")[1]!,
            "atEar",
          );
          const off: number = Vector3.length(
            Vector3.subtract(
              world(
                performance,
                "phone",
                seconds,
                phone.affordance("screen").frame.translation,
              ),
              HumanSignature.region(
                HumanSignature.of(performance, "a", body, 0),
                "earRight",
                seconds,
              ),
            ),
          );
          if (!(off <= 0.015))
            complaints.push(
              `${name}: the held phone's screen is ${mm(off)} mm from the right ear at atEar, within 15 mm expected`,
            );
        },
      ],
    ];
    // The glass on both statures; the phone on the average man, since one
    // body shows a flat device at the ear and each pick-up costs seconds.
    for (const [label, prop, chain, read] of tasks.filter(
      ([label]: (typeof tasks)[number]): boolean =>
        label === "glass" || name === "m-average",
    ))
      try {
        const performance: HumanPerformance = perform(prop, chain());
        read(performance);
        const moved: number = drift(performance, prop.subject);
        if (!(moved <= 0.001))
          complaints.push(
            `${name}: the held ${label} moves ${mm(moved)} mm in the hand's frame, within 1 mm expected`,
          );
      } catch (error) {
        complaints.push(
          `${name}: the held ${label}: expected to plan, got ${(error as Error).message}`,
        );
      }

    // 4. What a held prop cannot be asked.
    if (name !== "m-average") continue;
    for (const [label, chain, axis, lists] of [
      [
        "a drink from a glass left on the table",
        HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .handToFace({ task: "drink", prop: "glass" }),
        "prop",
        null,
      ],
      [
        "a point the glass lacks",
        HumanChain.subject("a")
          .pickUp({
          prop: "glass",
          handle: "body",
          use: { tip: "lip", line: "square", at: "mouth" },
        })
          .handToFace({ task: "drink", prop: "glass", point: "spout" }),
        "point",
        "lip",
      ],
    ] as const) {
      let thrown: unknown = null;
      try {
        perform(HumanObject.prop("glass", glass, stood), chain);
      } catch (error) {
        thrown = error;
      }
      if (
        !(
          thrown instanceof HumanRefusal &&
          thrown.kind === "affordance" &&
          thrown.axis === axis &&
          (lists === null ||
            (thrown.feasible?.kind === "alternatives" &&
              thrown.feasible.values.includes(lists)))
        )
      )
        complaints.push(
          `${name}: ${label}: expected an affordance refusal on ${axis}, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
        );
    }
  }
  TestValidator.equals("tasks with held objects", complaints, []);
}
