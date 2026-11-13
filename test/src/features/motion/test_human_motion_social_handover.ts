import { createDrinkware } from "@automovie/archetypes";
import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanMutual,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  HumanSocial,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Two people of different height pass a mug, an archetype held by the hand
 * that picked it up (#3364, #3358).
 *
 * The average man (a) and the small woman (b) face each other 0.8 m apart,
 * and in a second cast the other way round, since the taller and the shorter
 * person each give and each receive. The mug starts at the giver's waist
 * height before the right shoulder, 0.6 of the arm ahead, and is picked up
 * for its use (the lip level, the mug upright).
 *
 * Scenarios, in each cast:
 * 1. In the giver's hand from its grip to the release, and then in the
 *    receiver's hand to the end, the mug's axis stays within 10 degrees of
 *    upright (#3361: a held container stays level within 10 degrees), read
 *    every tenth of a second.
 * 2. Until the giver's `offered` the mug keeps its place in the giver's
 *    hand, and from the giver's `release` on its place in the receiver's
 *    hand, each within 1 mm (the campaign's grip bound), read every quarter
 *    of a second.
 * 3. At `offered` the mug lies within 0.15 m of the midpoint of the two
 *    chests (#3364, M10's acceptance).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places a real archetype, joins the cast through the public mutual join and reads the displayed prop frame and hands; a mug tipped over, sliding in a hand or offered away from between the two fails.
 * @evidence contracts/development/testing.md#independent-expectations Every bound is an acceptance line of #3361 or #3364.
 * @evidence contracts/development/testing.md#distinguishing-cases The taller person as giver and as receiver; the toast is `test_human_motion_social_toast_*`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and one archetype and builds two two-person performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the cast, the placement and the 3 scenarios with their bounds, sources and sampling.
 */ export function test_human_motion_social_handover(): void {
  const complaints: string[] = [];
  const mug: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "mug",
  });
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  const apart: number = 0.8;
  for (const [first, second] of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const) {
    const bodies: Record<"a" | "b", IHumanBody> = {
      a: motionHumanBody(first),
      b: motionHumanBody(second),
    };
    const label: string = `${first} with ${second}`;

    // Before a performer's right shoulder; b faces a, so b's right is +X.
    const before = (who: "a" | "b"): HumanObject.Placement => {
      const m: IHumanBody["measure"] = bodies[who].measure;
      const ahead: number = 0.6 * (m.upperArm + m.forearm);
      return {
        at: {
          x: who === "a" ? -m.shoulderHalfWidth : m.shoulderHalfWidth,
          y: m.waistHeight,
          z: who === "a" ? ahead : apart - ahead,
        },
        yaw: who === "a" ? 0 : 180,
      };
    };
    const perform = (
      props: IHumanProp[],
      composition: { node: HumanPerformance.IInput["composition"] },
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "social",
        laws: [HumanSocial.fistBump],
        props,
        performers: (["a", "b"] as const).map((subject: "a" | "b") => ({
          subject,
          body: bodies[subject],
          at: { x: 0, y: 0, z: subject === "a" ? 0 : apart },
          yaw: subject === "a" ? 0 : 180,
          proficiency: { level: "trained" as const },
        })),
        composition: composition.node,
      });
    const instant = (segment: HumanSegment.ISegment, event: string): number =>
      segment.start +
      (segment.plan.events.find((e): boolean => e.name === event)?.share ??
        NaN) *
        segment.plan.duration;
    const axis = (
      performance: HumanPerformance,
      prop: string,
      seconds: number,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(performance.prop(prop, seconds).rotation, {
        x: 0,
        y: 1,
        z: 0,
      });

    // How far a prop moves in a right hand's frame between two seconds.
    const drift = (
      performance: HumanPerformance,
      who: string,
      prop: string,
      from: number,
      to: number,
    ): number => {
      const seat = (seconds: number): IAutoMovieVector3 => {
        const hand: IAutoMovieResolvedBone = performance
          .bones(who, seconds)
          .get("rightHand")!;
        return Quaternion.rotateVector(
          Quaternion.inverse(hand.worldRotation),
          Vector3.subtract(
            performance.prop(prop, seconds).position,
            hand.worldPosition,
          ),
        );
      };
      const start: IAutoMovieVector3 = seat(from);
      let worst: number = 0;
      for (let seconds: number = from; seconds <= to; seconds += 0.25)
        worst = Math.max(
          worst,
          Vector3.length(Vector3.subtract(seat(seconds), start)),
        );
      return Math.max(worst, Vector3.length(Vector3.subtract(seat(to), start)));
    };

    // 1. The mug changes hands upright.
    try {
      const passed: HumanPerformance = perform(
        [HumanObject.prop("mug", mug, before("a"))],
        HumanChain.mutual(
          HumanMutual.handOver,
          {
            giver: HumanChain.subject("a").pickUp({
              prop: "mug",
              handle: "handle",
              use: { tip: "lip", line: "square" },
            }),
            receiver: HumanChain.subject("b").stand({ seconds: 0.3 }),
          },
          { prop: "mug", handle: "body" },
        ),
      );
      const give: HumanSegment.ISegment = passed.segments("a")[1]!;
      const grip: number = instant(passed.segments("a")[0]!, "gripClosed");
      const offered: number = instant(give, "offered");
      const release: number = instant(give, "release");
      // The mug's worst tilt while the giver carries it, and while the
      // receiver has it.
      // The holder's right arm at a second, for a complaint: each joint's
      // flexion, abduction and twist in degrees.
      const arm = (who: "a" | "b", seconds: number): string =>
        (["rightUpperArm", "rightLowerArm", "rightHand"] as const)
          .map((bone: string): string => {
            const joint = passed
              .pose(who, seconds)
              .joints.find((j): boolean => j.bone === bone);
            return `${bone} [${(joint?.flexion ?? 0).toFixed(0)}, ${(joint?.abduction ?? 0).toFixed(0)}, ${(joint?.twist ?? 0).toFixed(0)}]`;
          })
          .join(", ");
      for (const [phase, who, from, to] of [
        ["in the giver's hand", "a", grip, release],
        ["in the receiver's hand", "b", release, passed.duration],
      ] as const) {
        let tipped: number = 0;
        let when: number = from;
        for (let seconds: number = from; seconds <= to; seconds += 0.1) {
          const now: number =
            (Math.acos(Math.min(1, axis(passed, "mug", seconds).y)) * 180) /
            Math.PI;
          if (now > tipped) {
            tipped = now;
            when = seconds;
          }
        }
        if (!(tipped <= 10))
          complaints.push(
            `${label}: the mug tilts ${tipped.toFixed(1)} degrees ${phase} at ${when.toFixed(2)} s (grip ${grip.toFixed(2)}, offered ${offered.toFixed(2)}, release ${release.toFixed(2)}, end ${passed.duration.toFixed(2)}; ${arm(who, when)}), within 10 expected`,
          );
      }
      const held: number = drift(passed, "a", "mug", grip + 1e-3, offered);
      const taken: number = drift(
        passed,
        "b",
        "mug",
        release + 1e-3,
        passed.duration,
      );
      if (!(held <= 0.001))
        complaints.push(
          `${label}: the mug moves ${mm(held)} mm in the giver's hand before it is offered, within 1 mm expected`,
        );
      if (!(taken <= 0.001))
        complaints.push(
          `${label}: the mug moves ${mm(taken)} mm in the receiver's hand after the release, within 1 mm expected`,
        );
      const chest = (who: "a" | "b"): IAutoMovieVector3 =>
        HumanSignature.joint(
          HumanSignature.of(passed, who, bodies[who], 0),
          offered,
          "chest",
        );
      const off: number = Vector3.length(
        Vector3.subtract(
          passed.prop("mug", offered).position,
          Vector3.scale(Vector3.add(chest("a"), chest("b")), 0.5),
        ),
      );
      if (!(off <= 0.15))
        complaints.push(
          `${label}: the mug is offered ${mm(off)} mm from the midpoint of the chests, within 150 mm expected`,
        );
    } catch (error) {
      complaints.push(
        `${label}: the handover of a mug: expected to plan, got ${(error as Error).message}`,
      );
    }
  }
  TestValidator.equals("a mug passed between two heights", complaints, []);
}
