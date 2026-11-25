import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanHandTarget } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { throwsError } from "../../internal/throwsError";

/**
 * A fixed normal and explicit forward prepare the hand's rigid local offset.
 *
 * Scenarios:
 *
 * 1. Matched orthogonal world and rest axes give the unchanged palm offset. Roots
 *    and headings do not move it. Mutating a returned rotation cannot change
 *    the placement of the same target on a later read.
 * 2. Without an explicit forward, yaw zero turns the palm offset from +Y to +Z.
 *    Yaw 90 is along the normal, so the fallback +Y leaves the shift on +Y. A
 *    16-ulp absolute budget for unit coordinates covers the normalized
 *    quaternion operations in the quarter turn.
 * 3. An explicit forward parallel to the fixed normal is refused during
 *    preparation, before any posture is sampled.
 */
export async function test_motions_posture_hand_frame_preparation(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  body.surfaces.sockets.palmLeft = {
    bone: "leftHand",
    point: { x: 0, y: 0.125, z: 0 },
    normal: { x: 1, y: 0, z: 0 },
    forward: { x: 0, y: 1, z: 0 },
  };
  const normal: IAutoMovieVector3 = { x: -1, y: 0, z: 0 };
  const target: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };
  const root: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const fixed: ReturnType<typeof HumanHandTarget.prepareFrame> =
    HumanHandTarget.prepareFrame(body, "left", normal, {
      forward: { x: 0, y: 1, z: 0 },
    });
  const frame: ReturnType<typeof fixed> = fixed({ root, yaw: 0 });
  const initial: IAutoMovieMotionHumanHand.IWrist = frame.place(target);
  frame.rotation.x = 1;
  initial.rotation.w = 0;
  const reread: IAutoMovieMotionHumanHand.IWrist = fixed({
    root: target,
    yaw: 90,
  }).place(target);
  TestValidator.predicate(
    "fixed palmar shift is independent of posture or output edits",
    reread.point.x === 1 &&
      reread.point.y === 0.875 &&
      reread.point.z === 1 &&
      reread.rotation.w === 1,
  );

  const moving: ReturnType<typeof HumanHandTarget.prepareFrame> =
    HumanHandTarget.prepareFrame(body, "left", normal);
  const turn: IAutoMovieVector3 = moving({ root, yaw: 0 }).place(target).point;
  const fallback: IAutoMovieVector3 = moving({ root, yaw: 90 }).place(
    target,
  ).point;
  const rotationRoundoff: number = 16 * Number.EPSILON;
  TestValidator.predicate(
    "the heading changes the shift when forward is live",
    Math.abs(turn.x - 1) <= rotationRoundoff &&
      Math.abs(turn.y - 1) <= rotationRoundoff &&
      Math.abs(turn.z - 0.875) <= rotationRoundoff &&
      fallback.y === 0.875 &&
      fallback.z === 1,
  );

  TestValidator.predicate(
    "fixed parallel directions fail before the first sample",
    throwsError(
      (): unknown =>
        HumanHandTarget.prepareFrame(body, "left", normal, {
          forward: { x: 1, y: 0, z: 0 },
        }),
      "must not be parallel",
    ),
  );
}
