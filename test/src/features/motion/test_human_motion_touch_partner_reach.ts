import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSocial,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  type touchSite,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A palm laid on a partner's chest reaches its place wherever on the region
 * the place lies: the arm's fit lands the palm where its goal puts it.
 *
 * Two average men stand 0.6 m apart, face to face; one lays a comforting
 * palm (`HumanSocial.comfort`) on the other's sternum, with no site, with a
 * stated site 54 mm down and 31 mm toward the performer's left (across the
 * median plane, the place seed "second" draws within 50 mm), and with a
 * site 40 mm up and 40 mm out.
 *
 * Scenario: at the middle of the hold the displayed palm, the hand's contact,
 * lands within 5 mm of where the arm's goal puts it (provisional: the limb
 * fit's own re-aim tolerance is finer, and the touch's contact bound is
 * 15 mm). The complaint gives the same fit with the segment the palm rests on
 * kept clear like the rest of the partner, which held a palm 61 mm short of a
 * place across the median plane, and without the laid reference, so a miss
 * names what held the hand back.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each performance through the public chain and fits the posture it shows; a palm held off a reachable place fails with the size and what held it.
 * @evidence contracts/development/testing.md#independent-expectations The place is the law's own goal, which the fit must meet; the bound is stated and provisional, not read from the fit.
 * @evidence contracts/development/testing.md#distinguishing-cases The region's own point, a place across the median plane and below, and a place up and out.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds three short two-person performances, each read at one instant; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage, the three sites and the one scenario with its bound and status.
 */
export function test_human_motion_touch_partner_reach(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  const gap = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
    Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
  for (const [label, site] of [
    ["no site", undefined],
    [
      "54 mm down and 31 mm toward the performer's left",
      { up: -0.054, out: -0.031 },
    ],
    ["40 mm up and 40 mm out", { up: 0.04, out: 0.04 }],
  ] as const satisfies readonly (readonly [
    string,
    touchSite.ISite | undefined,
  ])[]) {
    const performance: HumanPerformance = new HumanPerformance({
      seed: "site",
      laws: [HumanSocial.comfort],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body,
          at: { x: 0, y: 0, z: 0.6 },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .registered("comfort", {
          target: { kind: "person", subject: "b", region: "sternum" },
          ...(site === undefined ? {} : { site }),
        })
        .with(HumanChain.subject("b").stand({ seconds: 5 })).node,
    });
    const placed: HumanSegment.ISegment = performance.segments("a")[1]!;
    const instant = (event: string): number =>
      placed.start +
      (placed.plan.events.find(
        (e: { name: string; share: number }): boolean => e.name === event,
      )?.share ?? NaN) *
        placed.plan.duration;
    const held: number = (instant("strokeEnd") + instant("relax")) / 2;
    const posture: IHumanPosture = performance.posture("a", held);
    const goal: IHumanPosture.IGoal | undefined = posture.limbs.rightArm;
    if (goal === undefined) {
      complaints.push(`${label}: the right arm holds no goal in the hold`);
      continue;
    }
    // Where the hand's contact (the palm) lands against where the goal puts
    // it: the fit re-aims the wrist so the contact stays put under the
    // rotation the hand reaches, so the contact is what it must meet.
    const contact: IAutoMovieVector3 = goal.contact ?? { x: 0, y: 0, z: 0 };
    const anchor: IAutoMovieVector3 = Vector3.add(
      goal.point,
      Quaternion.rotateVector(goal.rotation!, contact),
    );
    const landed = (
      bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ): number => {
      const hand: IAutoMovieResolvedBone = bones.get("rightHand")!;
      return gap(
        Vector3.add(
          hand.worldPosition,
          Quaternion.rotateVector(hand.worldRotation, contact),
        ),
        anchor,
      );
    };
    const refitted = (asked: IHumanPosture.IGoal): number =>
      landed(
        poseBones(
          body,
          resolveHumanPosture(body, {
            ...posture,
            limbs: { ...posture.limbs, rightArm: asked },
          }),
        ),
      );
    const shown: number = landed(performance.bones("a", held));
    if (!(shown <= 0.005)) {
      const { rests, reference: _reference, ...free } = goal;
      complaints.push(
        `${label}: the palm lands ${mm(shown)} mm from where its goal puts it, within 5 mm expected (with the rested segment kept clear like the rest of the partner ${mm(refitted({ ...free, ...(goal.reference === undefined ? {} : { reference: goal.reference }), clear: [...(goal.clear ?? []), ...(rests ?? [])] }))} mm; without the laid reference ${mm(refitted({ ...free, ...(rests === undefined ? {} : { rests }) }))} mm)`,
      );
    }
  }
  TestValidator.equals(
    "the palm reaches its place on the partner",
    complaints,
    [],
  );
}
