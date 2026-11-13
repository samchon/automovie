import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  HumanStageFight,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A stage slap makes no contact: the hand swings across the cheek it is
 * aimed at and never touches it, yet passes close enough to be a slap at
 * that face (#3347: the family stages the performers' motion, and a staged
 * blow is non-contact).
 *
 * The hand is read by three of its joints (the wrist, the middle finger's
 * knuckle and its last joint), which span the palm and the fingers. No
 * contact is a clearance above the motion campaign's 15 mm contact bound,
 * with the hand's own half thickness on top: 40 mm from every one of those
 * joints to the cheek's point. Close enough is provisional: within 0.3 m
 * at the nearest, a head's width, for which no stage combat source was
 * read. One film per pairing of two bodies of opposite build, so the slap
 * goes up and down.
 *
 * Scenarios, for each pairing, the slapper 0.6 m before the partner:
 * 1. Over the whole slap, read every 1/48 s, none of the three joints
 *    comes within 40 mm of the partner's left jaw.
 * 2. The nearest any of them comes is within 0.3 m of it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds two-person performances through the public chain and reads both displayed bodies over the whole act; a slap that touches, or one that swings nowhere near the face, fails with the distance and the instant.
 * @evidence contracts/development/testing.md#independent-expectations The clearance is the campaign's contact bound with the hand's thickness; the nearness is stated provisional; both are measured between displayed joints and a displayed region, never read from a plan.
 * @evidence contracts/development/testing.md#distinguishing-cases A lower and an upper bound on the same closest approach, on both orders of two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and two short films without props; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the bounds and their sources, and the 2 scenarios.
 */
export function test_human_motion_fight_stage_slap(): void {
  const complaints: string[] = [];
  for (const names of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const) {
    const bodies: Record<"a" | "b", IHumanBody> = {
      a: motionHumanBody(names[0]),
      b: motionHumanBody(names[1]),
    };
    const label: string = `${names[0]} slapping ${names[1]}`;
    let film: HumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "stage",
        laws: [HumanStageFight.stageSlap],
        performers: (["a", "b"] as const).map((subject) => ({
          subject,
          body: bodies[subject],
          at: { x: 0, y: 0, z: subject === "a" ? 0 : 0.6 },
          yaw: subject === "a" ? 0 : 180,
          proficiency: { level: "trained" as const },
        })),
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered("stageSlap", {
            target: { kind: "person", subject: "b", region: "jawLeft" },
          })
          .with(HumanChain.subject("b").stand({ seconds: 3 })).node,
      });
    } catch (error) {
      complaints.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const slap: HumanSegment.ISegment = film
      .segments("a")
      .find((s: HumanSegment.ISegment): boolean => s.name === "stageSlap")!;
    const slapper: HumanSignature.IReader = HumanSignature.of(
      film,
      "a",
      bodies.a,
      0,
    );
    const partner: HumanSignature.IReader = HumanSignature.of(
      film,
      "b",
      bodies.b,
      180,
    );
    let nearest: number = Infinity;
    let when: number = slap.start;
    for (let seconds: number = slap.start; seconds <= slap.end; seconds += 1 / 48) {
      const jaw: IAutoMovieVector3 = HumanSignature.region(
        partner,
        "jawLeft",
        seconds,
      );
      for (const bone of [
        "rightHand",
        "rightMiddleProximal",
        "rightMiddleDistal",
      ] as const) {
        const gap: number = Vector3.length(
          Vector3.subtract(HumanSignature.joint(slapper, seconds, bone), jaw),
        );
        if (gap < nearest) {
          nearest = gap;
          when = seconds;
        }
      }
    }
    if (!(nearest > 0.04))
      complaints.push(
        `${label}: the hand comes ${(nearest * 1000).toFixed(1)} mm from the jaw at ${when.toFixed(3)} s, more than 40 mm expected`,
      );
    if (!(nearest <= 0.3))
      complaints.push(
        `${label}: the hand's nearest to the jaw is ${(nearest * 1000).toFixed(0)} mm at ${when.toFixed(3)} s, 300 mm at most expected`,
      );
  }
  TestValidator.equals("a stage slap makes no contact", complaints, []);
}
