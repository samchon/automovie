import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

const { AutoMovieMotionHumanTouchEffector } = AutoMovieMotionHumanTouch;

/**
 * A standing quadriceps stretch keeps the hand on the ankle before release
 * and returns the same displayed body when the release is read first.
 *
 * Scenarios:
 * 1. Read the release first on one performer and advance a second performer
 *    in grid order. Compare the pelvis, both feet and the gripping arm.
 * 2. During the hold the fist's grip lies within 5 cm of the raised ankle.
 *    The opposite foot stays on its entry placement throughout the hold.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the single-actor stretch, order and measured landmarks.
 * @evidence contracts/development/testing.md#behavioral-verification Observes actual world frames and the fist's surface from two public performances.
 * @evidence contracts/development/testing.md#independent-expectations The stretch law places the grip on the ankle within its 5 cm criterion and the standing foot stays on its entry support. Separate performances distinguish a late first read from chronological continuation.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks entry, hold, release and late-first return on an articulated arm and both supported and raised legs.
 * @evidence contracts/development/testing.md#execution-ownership Builds one canonical body and two short native performances; no process or fixture replacement.
 */
export function test_motion_support_stretch_return_support(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const build = (): HumanPerformance =>
    new HumanPerformance({
      seed: "stretch",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").act("stretch", {
        kind: "quadriceps",
        hold: 0.5,
      }).node,
    });
  const late: HumanPerformance = build();
  const forward: HumanPerformance = build();
  const segment: IAutoMovieMotionHumanSegment = late.segments("a")[0]!;
  const event = (name: string): number =>
    segment.plan.duration *
    segment.plan.events.find((entry) => entry.name === name)!.share;
  const release: number = event("release");
  const firstReturn: number = release + 1 / 30;
  const later: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = late.bones(
    "a",
    firstReturn,
  );
  const reach: number = event("reachEnd");
  const entryFoot: IAutoMovieVector3 = forward
    .bones("a", 0)
    .get("leftFoot")!.worldPosition;
  for (let frame: number = 0; frame <= Math.round(firstReturn * 30); frame++) {
    const time: number = frame / 30;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      forward.bones("a", time);
    if (time >= reach && time <= release) {
      const grip: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.point(
        body,
        bones,
        "right",
        { surface: "grip", shape: "fist" },
      );
      TestValidator.predicate(
        "grip stays on raised ankle",
        Vector3.length(
          Vector3.subtract(grip, bones.get("rightFoot")!.worldPosition),
        ) <= 0.05,
      );
      TestValidator.predicate(
        "support foot stays planted",
        Vector3.length(
          Vector3.subtract(entryFoot, bones.get("leftFoot")!.worldPosition),
        ) <= 0.005,
      );
    }
  }
  const reached: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    forward.bones("a", firstReturn);
  for (const name of [
    "hips",
    "leftFoot",
    "rightFoot",
    "rightUpperArm",
    "rightLowerArm",
    "rightHand",
  ] as const)
    TestValidator.predicate(
      "late first read agrees at " + name,
      Vector3.length(
        Vector3.subtract(
          later.get(name)!.worldPosition,
          reached.get(name)!.worldPosition,
        ),
      ) <= 1e-10,
    );
}
