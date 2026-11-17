import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanFrame } from "../internal/motionHumanFrame";
import { nclose } from "../internal/nclose";

/**
 * A film's pose at an instant is a function of the plan and that instant
 * alone: two films of the same input show the same pose at every instant,
 * to the last bit, whichever order their instants are read in.
 *
 * Every limb fit is solved from its own inputs, so a pose that depended on
 * which instant was read before it would let playback, seeking and capture
 * at different rates disagree.
 *
 * Scenarios, the average man, each film built twice and read at five
 * instants spread over it, on distinct body wrappers of the same prepared
 * geometry so the resolved performances share nothing:
 * 1. A brief kneel, whose hands rest on the thighs under the arm's
 *    clearance search.
 * 2. Sitting down into an armchair, whose hands reach for the armrests.
 * 3. A walk of 2 m with a wave over it, an arm layered over stepping legs.
 * The first film is read forward and the second backward. Every bone's
 * world position and rotation at every instant is the same number in both.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs real films through the public chain and compares the displayed bones of two readings; a pose that differs in any bone at any instant between a forward and a backward reading fails.
 * @evidence contracts/development/testing.md#independent-expectations Pose by time is the motion contract (a pose depends on the plan and the instant only); the forward reading is the oracle for the backward one, compared to the last bit, and neither is read from a solver's bookkeeping.
 * @evidence contracts/development/testing.md#distinguishing-cases Arm goals under clearance, arm goals that travel, and an overlay over stepping legs; forward against backward order on separately built films. This spec owned the former limb-fit memory's equality with a direct solve; that memory is removed, and the order independence is what remains of it.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds six short performances in memory, reading five instants of each: one body, since the claim is equality, not anatomy.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, why it matters and the 3 scenarios with how each is read.
 */
export function test_human_motion_core_pose_read_order(): void {
  const complaints: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const height: number = seated.popliteal(body);
  const aside: number = body.measure.chestBreadth / 2 + 0.08;
  const perform: (
    composition: IAutoMovieMotionHumanPerformance.IInput["composition"],
    who: IAutoMovieMotionHumanBody,
  ) => IAutoMovieMotionHumanPerformance = (
    composition: IAutoMovieMotionHumanPerformance.IInput["composition"],
    who: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "fit-memory",
      laws: [...HUMAN_LEXICON.pose!],
      performers: [
        {
          subject: "a",
          body: who,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition,
    });
  const films: readonly (readonly [
    string,
    () => IAutoMovieMotionHumanPerformance.IInput["composition"],
  ])[] = [
    [
      "a brief kneel",
      (): IAutoMovieMotionHumanPerformance.IInput["composition"] =>
        HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered("kneelBriefly").node,
    ],
    [
      "sitting into an armchair",
      (): IAutoMovieMotionHumanPerformance.IInput["composition"] =>
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
      (): IAutoMovieMotionHumanPerformance.IInput["composition"] =>
        HumanChain.subject("a")
          .walk({ to: { x: 0, y: 0, z: 2 } })
          .over((o: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain => o.gesture({ kind: "wave" }))
          .node,
    ],
  ];

  // Copy scalars now so later workspace writes cannot change the oracle.
  const shown: (
    performance: IAutoMovieMotionHumanPerformance,
    t: number,
  ) => Map<AutoMovieHumanoidBone, readonly number[]> = (
    performance: IAutoMovieMotionHumanPerformance,
    t: number,
  ): Map<AutoMovieHumanoidBone, readonly number[]> => {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      performance.bones("a", t);
    motionHumanFrame(bones, `read order at ${t} s`);
    return new Map(
      [...bones.entries()].map(
        ([bone, at]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): [
          AutoMovieHumanoidBone,
          readonly number[],
        ] => [
          bone,
          [
            at.worldPosition.x,
            at.worldPosition.y,
            at.worldPosition.z,
            at.worldRotation.x,
            at.worldRotation.y,
            at.worldRotation.z,
            at.worldRotation.w,
          ],
        ],
      ),
    );
  };
  for (const [label, compose] of films)
    try {
      const forward: IAutoMovieMotionHumanPerformance = perform(compose(), { ...body });
      const end: number = forward.segments("a").at(-1)!.end;
      const instants: number[] = [0.1, 0.3, 0.5, 0.7, 0.9].map(
        (share: number): number => share * end,
      );
      const first: Map<AutoMovieHumanoidBone, readonly number[]>[] =
        instants.map(
          (t: number): Map<AutoMovieHumanoidBone, readonly number[]> =>
            shown(forward, t),
        );
      const backward: IAutoMovieMotionHumanPerformance = perform(compose(), { ...body });
      for (let i: number = instants.length - 1; i >= 0; --i) {
        const actual: Map<AutoMovieHumanoidBone, readonly number[]> = shown(
          backward,
          instants[i]!,
        );
        const expected: Map<AutoMovieHumanoidBone, readonly number[]> =
          first[i]!;
        if (
          actual.size !== expected.size ||
          [...expected].some(
            ([bone, values]: [
              AutoMovieHumanoidBone,
              readonly number[],
            ]): boolean => {
              const observed: readonly number[] | undefined = actual.get(bone);
              return (
                observed === undefined ||
                values.length !== observed.length ||
                values.some(
                  (value: number, k: number): boolean =>
                    !nclose(observed[k]!, value, 0),
                )
              );
            },
          )
        )
          complaints.push(
            `${label}: the pose at ${instants[i]!.toFixed(2)} s read backward differs from the pose read forward`,
          );
      }
    } catch (error) {
      complaints.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  TestValidator.equals(
    "a pose does not depend on the reading order",
    complaints,
    [],
  );
}
