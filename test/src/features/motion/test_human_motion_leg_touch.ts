import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  legTouch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A standing person touches a place with a part of the leg (#3357: the
 * effectors below the hip), the other leg bearing the body.
 *
 * Scenarios, on the small woman and the average man, each standing at the
 * origin facing +Z, read at the middle of the hold:
 * 1. The toes on a point 0.15 m above the floor and 0.3 m ahead of the right
 *    hip: the right toes' joint lies within 15 mm of it (the campaign's
 *    contact bound).
 * 2. The heel on a point 0.2 m above the floor and 0.25 m ahead: the right
 *    ankle's joint stands above the point by its own standing height within
 *    15 mm, and within 60 mm of it on the floor's plane (provisional: the
 *    heel's pad lies a few centimetres behind the ankle).
 * 3. The knee on a point 0.15 m below the hip joint and 0.9 of the thigh
 *    ahead of it, facing back at the performer: the knee's joint lies
 *    between 35 and 65 mm from the point (provisional: the joint centre is
 *    about 50 mm under the knee's front).
 * 4. In each, the left ankle stays within 5 mm of where it stood (the
 *    campaign's bound for a planted support), and the right ankle is back
 *    within 5 mm of where it stood at the action's end.
 * 5. In each, the pelvis has moved at least 20 mm toward the standing foot's
 *    side (provisional: a person on one leg stands over it).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the law, performs it through the public chain and reads displayed joints; a leg that stays down, a part off its place, a standing foot that slides or a body that does not move over its foot fails.
 * @evidence contracts/development/testing.md#independent-expectations The 15 mm and 5 mm are the campaign's bounds (#3354); the places are stated on the body's own rest joints; the provisional bounds are stated as such.
 * @evidence contracts/development/testing.md#distinguishing-cases Three parts of the leg on two statures.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds six short performances, each read at three instants; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 5 scenarios with their bounds.
 */
export function test_human_motion_leg_touch(): void {
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(0);
  const gap = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
    Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
  for (const name of ["f-small", "m-average"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const hip: IAutoMovieVector3 = body.rest.get("rightUpperLeg")!;
    const stood: number = body.rest.get("rightFoot")!.y;
    const places: Record<
      legTouch.With,
      { at: IAutoMovieVector3; normal: IAutoMovieVector3 }
    > = {
      toes: {
        at: { x: hip.x, y: 0.15, z: 0.3 },
        normal: { x: 0, y: 1, z: 0 },
      },
      heel: {
        at: { x: hip.x, y: 0.2, z: 0.25 },
        normal: { x: 0, y: 1, z: 0 },
      },
      knee: {
        at: { x: hip.x, y: hip.y - 0.15, z: hip.z + 0.9 * body.measure.thigh },
        normal: { x: 0, y: 0, z: -1 },
      },
    };
    for (const part of ["toes", "heel", "knee"] as const) {
      const label: string = `${name}: ${part}`;
      try {
        const performance: HumanPerformance = new HumanPerformance({
          seed: "leg",
          laws: [legTouch],
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
            .registered("legTouch", {
              target: {
                kind: "point",
                at: places[part].at,
                frame: "world",
                normal: places[part].normal,
              },
              with: part,
            }).node,
        });
        const placed: HumanSegment.ISegment = performance.segments("a")[1]!;
        const instant = (event: string): number =>
          placed.start +
          (placed.plan.events.find((e): boolean => e.name === event)?.share ??
            NaN) *
            placed.plan.duration;
        const held: number = (instant("ready") + instant("relax")) / 2;
        const reader: HumanSignature.IReader = HumanSignature.of(
          performance,
          "a",
          body,
          0,
        );
        const joint = (
          bone: AutoMovieHumanoidBone,
          seconds: number,
        ): IAutoMovieVector3 => HumanSignature.joint(reader, seconds, bone);
        const at: IAutoMovieVector3 = places[part].at;

        // 1, 2, 3. The part on its place.
        if (part === "toes") {
          const off: number = gap(joint("rightToes", held), at);
          if (!(off <= 0.015))
            complaints.push(
              `${label}: the toes' joint lies ${mm(off)} mm from the place, within 15 mm expected`,
            );
        } else if (part === "heel") {
          const ankle: IAutoMovieVector3 = joint("rightFoot", held);
          if (!(Math.abs(ankle.y - at.y - stood) <= 0.015))
            complaints.push(
              `${label}: the ankle stands ${mm(ankle.y - at.y)} mm above the place, its standing ${mm(stood)} mm within 15 mm expected`,
            );
          const level: number = Math.hypot(ankle.x - at.x, ankle.z - at.z);
          if (!(level <= 0.06))
            complaints.push(
              `${label}: the ankle lies ${mm(level)} mm from the place on the floor's plane, within 60 mm expected`,
            );
        } else {
          const off: number = gap(joint("rightLowerLeg", held), at);
          if (!(off >= 0.035 && off <= 0.065))
            complaints.push(
              `${label}: the knee's joint lies ${mm(off)} mm from the place, between 35 and 65 mm expected`,
            );
        }

        // 4. The standing foot planted; the moving foot back.
        const slid: number = gap(
          joint("leftFoot", held),
          joint("leftFoot", placed.start),
        );
        if (!(slid <= 0.005))
          complaints.push(
            `${label}: the standing ankle moved ${mm(slid)} mm, within 5 mm expected`,
          );
        const back: number = gap(
          joint("rightFoot", placed.end),
          joint("rightFoot", placed.start),
        );
        if (!(back <= 0.005))
          complaints.push(
            `${label}: the moving ankle ends ${mm(back)} mm from where it stood, within 5 mm expected`,
          );

        // 5. Over the standing foot: the left is +X.
        const over: number =
          joint("hips", held).x - joint("hips", placed.start).x;
        if (!(over >= 0.02))
          complaints.push(
            `${label}: the pelvis moved ${mm(over)} mm toward the standing foot, at least 20 mm expected`,
          );
      } catch (error) {
        complaints.push(
          `${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
  TestValidator.equals("a touch with the leg", complaints, []);
}
