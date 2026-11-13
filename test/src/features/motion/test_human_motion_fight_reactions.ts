import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";
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
 * In a stage fight the receiver's response is an action of its own, synced
 * to the attacker's contact: it begins with the contact, never before it,
 * and goes the way the contact sends it.
 *
 * Stage combat has the receiver turn the head with the slapping hand's
 * passage, away from the hand (SAFD unarmed technique, as #3347 records
 * it), step back from a shove, and follow the hand that grabs and pulls.
 * Two instants meet when they fall in one frame at 24 Hz. Before the
 * contact the receiver stands still: a head that turns under 0.5 degrees
 * and a chest that travels under 5 mm have not started.
 *
 * Scenarios, the attacker the average man, the receiver the small woman and
 * then the large man, facing each other:
 * 1. A slap to the receiver's left jaw with `slapped` synced to it: the
 *    head's heading is unchanged (0.5 degrees) from 0.2 s before the contact
 *    to the contact, has turned more than 2 degrees one frame after it, and
 *    at the reaction's peak has turned 20 to 70 degrees to the receiver's
 *    right, away from the hand on their left (provisional band: no slap
 *    study gives the head's rotation).
 * 2. A shove on the sternum with `shoved` synced to it: the chest is still
 *    (5 mm) until the contact and ends more than 0.1 m farther from the
 *    attacker.
 * 3. A grab of the left upper arm with `grabbed` synced to it, led toward
 *    the attacker's chest: the chest is
 *    still until the contact and at the reaction's peak is more than 10 mm
 *    nearer the attacker.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds two-person performances through the public chain and sync and reads the receiver's displayed head and chest; a reaction that starts early or late, turns toward the hand, or goes the wrong way fails.
 * @evidence contracts/development/testing.md#independent-expectations The instants are the attacker's own contact and the film's frame; the directions are stage-combat practice; the size band is stated provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Three contacts with three responses, each checked before, at and after the contact; two receivers of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares three polygon men and builds six short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule with its source, the bounds and the 3 scenarios.
 */
export function test_human_motion_fight_reactions(): void {
  const FRAME: number = 1 / 24;
  const attacker: IHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  const on = (region: string): object => ({
    target: { kind: "person", subject: "b", region },
  });
  const cases: readonly (readonly [
    "slap" | "shove" | "grab",
    object,
    string,
    number,
    AutoMovieHumanoidRegion,
  ])[] = [
    ["slap", on("jawLeft"), "slapped", 0.35, "palmRight"],
    ["shove", on("sternum"), "shoved", 0.6, "palmRight"],
    ["grab", on("upperArmLeft"), "grabbed", 0.6, "sternum"],
  ];

  for (const name of ["f-small", "m-large"] as const) {
    const receiver: IHumanBody = motionHumanBody(name);
    for (const [act, params, response, gap, source] of cases) {
      const film: HumanPerformance = new HumanPerformance({
        seed: "stage-fight",
        laws: Object.values(HumanStageFight),
        performers: [
          {
            subject: "a",
            body: attacker,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body: receiver,
            at: { x: 0, y: 0, z: gap },
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.5 })
          .registered(act, params, "attack")
          .with(
            HumanChain.subject("b")
              .stand({ seconds: 6 })
              .registered(response, {
                from: { kind: "person", subject: "a", region: source },
              })
              .sync({ of: "attack" }),
          ).node,
      });
      const struck: HumanSegment.ISegment = film
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.name === act)!;
      const answer: HumanSegment.ISegment = film
        .segments("b")
        .find((s: HumanSegment.ISegment): boolean => s.name === response)!;
      const contact: number =
        struck.start + (struck.plan.contact ?? Number.NaN);
      const reader: HumanSignature.IReader = HumanSignature.of(
        film,
        "b",
        receiver,
        180,
      );
      const label: string = `${response} on ${name}`;

      // The receiver's forward is -Z and their right is +X in the world.
      const heading = (seconds: number): number => {
        const forward: IAutoMovieVector3 = Quaternion.rotateVector(
          HumanSignature.bones(reader, seconds).get("head")!.worldRotation,
          { x: 0, y: 0, z: 1 },
        );
        return (Math.atan2(forward.x, -forward.z) * 180) / Math.PI;
      };
      const chest = (seconds: number): IAutoMovieVector3 =>
        HumanSignature.joint(reader, seconds, "chest");
      const moved = (from: number, to: number): number =>
        Vector3.length(Vector3.subtract(chest(to), chest(from)));
      if (!(Math.abs(answer.entryTime - contact) <= FRAME))
        complaints.push(
          `${label}: the response begins at ${answer.entryTime.toFixed(3)} s, within a frame of the contact at ${contact.toFixed(3)} s expected`,
        );
      const peaked: number =
        answer.start +
        (answer.plan.events.find((e): boolean => e.name === "stroke")?.share ??
          Number.NaN) *
          answer.plan.duration;
      if (act === "slap") {
        const early: number = Math.abs(
          heading(contact) - heading(contact - 0.2),
        );
        if (!(early <= 0.5))
          complaints.push(
            `${label}: the head turns ${early.toFixed(2)} degrees before the contact, 0.5 at most expected`,
          );
        const begun: number = Math.abs(
          heading(contact + FRAME) - heading(contact),
        );
        if (!(begun > 2))
          complaints.push(
            `${label}: one frame after the contact the head has turned ${begun.toFixed(2)} degrees, more than 2 expected`,
          );
        const peak: number = heading(peaked) - heading(contact);
        if (!(peak >= 20 && peak <= 70))
          complaints.push(
            `${label}: at its peak the head has turned ${peak.toFixed(1)} degrees to the receiver's right, 20 to 70 expected (provisional)`,
          );
        continue;
      }
      const early: number = moved(contact - 0.2, contact);
      if (!(early <= 0.005))
        complaints.push(
          `${label}: the chest travels ${(early * 1000).toFixed(1)} mm before the contact, 5 mm at most expected`,
        );

      // Away from the attacker is +Z in the world.
      const went: number =
        act === "shove"
          ? chest(answer.end).z - chest(contact).z
          : chest(contact).z - chest(peaked).z;
      const least: number = act === "shove" ? 0.1 : 0.01;
      if (!(went > least))
        complaints.push(
          `${label}: the chest goes ${(went * 1000).toFixed(0)} mm ${act === "shove" ? "away from" : "toward"} the attacker, more than ${least * 1000} mm expected`,
        );
    }
  }
  TestValidator.equals("a receiver answers the contact", complaints, []);
}
