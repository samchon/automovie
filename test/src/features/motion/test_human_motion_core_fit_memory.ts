import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  type IHumanBody,
  resolveHumanPosture,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A limb fit read from memory is the fit the solver gives: a film shows
 * the same pose at every instant whether each fit is solved afresh or
 * remembered, and in whatever order its instants are read.
 *
 * `resolveHumanPosture` remembers each limb's fit by everything the fit
 * reads. A key that missed one input would hand a pose of another instant
 * back silently, so the remembered poses are compared with solved ones to
 * the last bit.
 *
 * Scenarios, the average man, each film built twice and read at five
 * instants spread over it:
 * 1. A brief kneel, whose hands rest on the thighs under the arm's
 *    clearance search.
 * 2. Sitting down into an armchair, whose hands reach for the armrests.
 * 3. A walk of 2 m with a wave over it, an arm layered over stepping legs.
 * The first is built and read forward with the memory turned off
 * (`resolveHumanPosture.memory`), so every fit is solved. The second is read backward with the
 * memory left to fill, so the fits the plan solved are read again by the
 * display and later instants find earlier ones' entries. Every bone's
 * world position and rotation at every instant is the same number in both.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs real films through the public chain and compares the displayed bones of two readings; a remembered fit that differs from the solved one in any bone at any instant fails.
 * @evidence contracts/development/testing.md#independent-expectations A memory of a pure function changes no value; the solved reading is the oracle and the remembered one is compared with it, neither read from the memory's own bookkeeping.
 * @evidence contracts/development/testing.md#distinguishing-cases Arm goals under clearance, arm goals that travel, and an overlay over stepping legs; forward against backward order, cold against filled memory.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds six short performances in memory, reading five instants of each: one body, since the memory is kept per body and the claim is equality, not anatomy.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, why it matters and the 3 scenarios with how each is read.
 */
export function test_human_motion_core_fit_memory(): void {
  const complaints: string[] = [];
  const body: IHumanBody = motionHumanBody("m-average");
  const height: number = seated.popliteal(body);
  const aside: number = body.measure.chestBreadth / 2 + 0.08;
  const perform = (
    composition: HumanPerformance.IInput["composition"],
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "fit-memory",
      laws: [...HUMAN_LEXICON.pose!],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition,
    });
  const films: readonly (readonly [
    string,
    () => HumanPerformance.IInput["composition"],
  ])[] = [
    [
      "a brief kneel",
      (): HumanPerformance.IInput["composition"] =>
        HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered("kneelBriefly").node,
    ],
    [
      "sitting into an armchair",
      (): HumanPerformance.IInput["composition"] =>
        HumanChain.subject("a").sit({
          seat: {
            at: { x: 0, y: height, z: -0.1 },
            yaw: 0,
            depth: 0.45,
            armrests: {
              left: { x: aside, y: height + 0.22, z: -0.3 },
              right: { x: -aside, y: height + 0.22, z: -0.3 },
            },
          },
          seconds: 1,
        }).node,
    ],
    [
      "a walk with a wave",
      (): HumanPerformance.IInput["composition"] =>
        HumanChain.subject("a")
          .walk({ to: { x: 0, y: 0, z: 2 } })
          .over((o: HumanChain): HumanChain => o.gesture({ kind: "wave" }))
          .node,
    ],
  ];

  // Every bone's world position and rotation, as text that differs when any number does.
  const shown = (performance: HumanPerformance, t: number): string =>
    JSON.stringify(
      [...performance.bones("a", t).entries()].map(
        ([bone, at]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): [
          string,
          unknown,
          unknown,
        ] => [bone, at.worldPosition, at.worldRotation],
      ),
    );
  for (const [label, compose] of films)
    try {
      resolveHumanPosture.memory(false);
      const solved: HumanPerformance = perform(compose());
      const end: number = solved.segments("a").at(-1)!.end;
      const instants: number[] = [0.1, 0.3, 0.5, 0.7, 0.9].map(
        (share: number): number => share * end,
      );
      const afresh: string[] = instants.map((t: number): string =>
        shown(solved, t),
      );
      resolveHumanPosture.memory(true);
      const remembered: HumanPerformance = perform(compose());
      for (let i: number = instants.length - 1; i >= 0; --i)
        if (shown(remembered, instants[i]!) !== afresh[i])
          complaints.push(
            `${label}: the pose at ${instants[i]!.toFixed(2)} s read from memory differs from the pose solved afresh`,
          );
    } catch (error) {
      complaints.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      resolveHumanPosture.memory(true);
    }
  TestValidator.equals("a remembered fit is the solved fit", complaints, []);
}
