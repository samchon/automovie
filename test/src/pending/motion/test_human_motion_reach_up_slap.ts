import {
  HumanChain,
  HumanPerformance,
  HumanStageFight,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../features/internal/motionHumanBody";

/**
 * A short person reaches a tall person's face: the small woman slaps the
 * average man's cheek, forehand and backhand, standing 0.35 m from him.
 *
 * Pending: `touch` refuses both as out of reach, the cheek 127 mm beyond
 * her right arm for the open palm and 155 mm for the back of the hand, at
 * the 45 degree lean it allows. A person 1.5 m tall reaches well above her
 * own head, so the cheek of a man 1.76 m tall is within her arm; what the
 * touch lacks is the arm raised past the shoulder with the hand laid from
 * below, and a rise onto the toes.
 *
 * Scenarios:
 * 1. Her forehand slap on his left cheek plans.
 * 2. Her backhand on his right cheek plans.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the rows and builds the performances through the public surface; a refused slap fails with the refusal's message.
 * @evidence contracts/development/testing.md#independent-expectations That an adult of her height reaches a face 0.25 m above her own is ordinary human reach, not a reading of the law.
 * @evidence contracts/development/testing.md#distinguishing-cases The palm and the back of the hand, on the two cheeks.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men; a pending specification until the touch reaches above the shoulder.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, why the file is pending with its numbers, and the 2 scenarios.
 */
export function test_human_motion_reach_up_slap(): void {
  const she: IHumanBody = motionHumanBody("f-small");
  const he: IHumanBody = motionHumanBody("m-average");
  const laws: IHumanActionLaw<never>[] = [
    HumanStageFight.slap,
    HumanStageFight.backhand,
  ];
  const complaints: string[] = [];
  for (const [name, region] of [
    ["slap", "jawLeft"],
    ["backhand", "jawRight"],
  ] as const)
    try {
      new HumanPerformance({
        seed: "reach",
        laws,
        performers: [
          {
            subject: "a",
            body: she,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body: he,
            at: { x: 0, y: 0, z: 0.35 },
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered(name, {
            target: { kind: "person", subject: "b", region },
          })
          .with(HumanChain.subject("b").stand({ seconds: 0.3 })).node,
      });
    } catch (error) {
      complaints.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  TestValidator.equals("a short person reaches a tall face", complaints, []);
}
