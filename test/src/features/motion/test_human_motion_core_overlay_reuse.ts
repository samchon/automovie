import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanSegment,
  look,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanFrame } from "../internal/motionHumanFrame";

/**
 * Two fading real overlays share each law's raw posture for one exact query
 * while keeping every branch's displayed fit independent.
 *
 * A stationary polygon Human waves with the right hand and looks at one
 * world point. An owned registered wrapper delegates to the real look law
 * and counts its supplied aim reader, without replacing any method. A
 * fresh ordinary look performance supplies an independent numeric parity
 * comparison; the world target and unchanged planted feet are physical
 * observations rather than a producer snapshot.
 *
 * Scenarios:
 * 1. Inside the common entry fade, one actual look posture reads its target
 *    once, even though the preceding wave splits the fade into branches.
 * 2. A distinct exact query reads once again, whereas rereading the cached
 *    displayed instant performs no new target read.
 * 3. Displayed positions and orientations equal the independently resolved
 *    ordinary composition and remain finite/unit on every inspected bone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the actual laws, counter ownership, query/cache distinction and numeric comparison.
 * @evidence contracts/development/testing.md#behavioral-verification Runs real wave/look plans through public performance overlays, observes an owned actual target read and all displayed bones; repeated raw evaluation, cross-query leakage or changed fade output fail.
 * @evidence contracts/development/testing.md#independent-expectations A look posture has one target observation; differing fade branches do not change that target/time. Independent body identities prevent the comparison from reading the same resolved state. This parity check does not prove all gaze physics.
 * @evidence contracts/development/testing.md#distinguishing-cases Two fading overlays, two nearby exact times, a repeated cached time, actual head and untouched feet, and ordinary versus registered delegation.
 * @evidence contracts/development/testing.md#execution-ownership Two independent wrappers of one canonical polygon Human and owned public callbacks in memory; no renderer, monkeypatch, private import or compiler is started.
 */
export function test_human_motion_core_overlay_reuse(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const target: IAutoMovieMotionTarget = {
    kind: "point",
    frame: "world",
    at: { x: 0.3, y: 1.2, z: 6 },
  };
  let reads: number = 0;
  const counted: IAutoMovieMotionHumanActionLaw = {
    name: "countedLook",
    overlay: look.overlay,
    interrupts: look.interrupts,
    plan: (context: IAutoMovieMotionHumanActionContext): IAutoMovieMotionHumanActionPlan =>
      look.plan({
        ...context,
        params: { target, with: "head", seconds: 1 },
        aim: (
          asked: IAutoMovieMotionTarget,
          seconds: number,
        ): ReturnType<IAutoMovieMotionHumanActionContext["aim"]> => {
          reads++;
          return context.aim(asked, seconds);
        },
      }),
  };
  const perform: (observed: boolean) => IAutoMovieMotionHumanPerformance = (
    observed: boolean,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "overlay-reuse",
      laws: observed ? [counted] : [],
      performers: [
        {
          subject: "a",
          body: { ...body },
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 2, sway: 0 })
        .over(
          (upper: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
            upper.gesture({ kind: "wave", side: "right" }),
        )
        .over(
          (upper: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
            observed
              ? upper.registered("countedLook")
              : upper.look({ target, with: "head", seconds: 1 }),
        ).node,
    });
  const measured: IAutoMovieMotionHumanPerformance = perform(true);
  const ordinary: IAutoMovieMotionHumanPerformance = perform(false);
  const complaints: string[] = [];
  const resting: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    measured.bones("a", 0);
  for (const seconds of [HumanSegment.FADE / 2, HumanSegment.FADE * 0.6]) {
    reads = 0;
    const actual: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      measured.bones("a", seconds);
    motionHumanFrame(actual, `overlay reuse at ${seconds} s`);
    if (reads !== 1)
      complaints.push(
        `${seconds} s: look target read ${reads} times, expected one`,
      );
    const expected: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      ordinary.bones("a", seconds);
    motionHumanFrame(expected, `ordinary overlay at ${seconds} s`);
    for (const [bone, shown] of actual) {
      const comparison: IAutoMovieResolvedBone = expected.get(bone)!;
      const position: number = Math.hypot(
        shown.worldPosition.x - comparison.worldPosition.x,
        shown.worldPosition.y - comparison.worldPosition.y,
        shown.worldPosition.z - comparison.worldPosition.z,
      );
      const rotation: number = Math.min(
        Math.hypot(
          shown.worldRotation.x - comparison.worldRotation.x,
          shown.worldRotation.y - comparison.worldRotation.y,
          shown.worldRotation.z - comparison.worldRotation.z,
          shown.worldRotation.w - comparison.worldRotation.w,
        ),
        Math.hypot(
          shown.worldRotation.x + comparison.worldRotation.x,
          shown.worldRotation.y + comparison.worldRotation.y,
          shown.worldRotation.z + comparison.worldRotation.z,
          shown.worldRotation.w + comparison.worldRotation.w,
        ),
      );
      if (!(position <= 1e-9 && rotation <= 1e-9))
        complaints.push(`${seconds} s ${bone}: output changed`);
      if (bone === "leftFoot" || bone === "rightFoot") {
        const planted: IAutoMovieResolvedBone = resting.get(bone)!;
        const slip: number = Math.hypot(
          shown.worldPosition.x - planted.worldPosition.x,
          shown.worldPosition.y - planted.worldPosition.y,
          shown.worldPosition.z - planted.worldPosition.z,
        );
        if (!(slip <= 0.001))
          complaints.push(`${seconds} s ${bone}: planted foot moved ${slip} m`);
      }
    }
    reads = 0;
    measured.bones("a", seconds);
    if (reads !== 0)
      complaints.push(
        `${seconds} s: cached display re-read look ${reads} times`,
      );
  }
  TestValidator.equals(
    "overlay reuse preserves actual displayed motion",
    complaints,
    [],
  );
}
