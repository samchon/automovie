import type {
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateMotion } from "../../../../packages/engine/src/validation/validateMotion";
import { createSkeleton } from "../internal/createSkeleton";
import { hasViolation } from "../internal/hasViolation";
import { joint } from "../internal/joint";
import { keyframe } from "../internal/keyframe";
import { makeExpression } from "../internal/makeExpression";
import { makeMotion } from "../internal/makeMotion";
import { makePose } from "../internal/makePose";

const rest: IAutoMoviePose = makePose([joint("leftLowerArm", { flexion: 0 })]);

/**
 * Exercise expression admission through the motion keyframe's owning diagnostic path.
 *
 * Scenarios:
 * 1. A one-second clip has supported poses and a second-keyframe jawOpen weight of 1.5, yielding a range violation beneath keyframes[1].expression.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateMotion with one out-of-range expression weight and requires its keyframe-rooted range finding, catching omitted expression validation or lost parent addressing.
 * @evidence contracts/testing.md#independent-expectations Blendshape weights occupy inclusive [0,1], so 1.5 is unsupported; the second key's literal owning address does not depend on generated facial output.
 * @evidence contracts/testing.md#distinguishing-cases Retains the first key's supported expression and second key's excessive weight; dedicated expression entries own preset/channel/intensity admission and motion_valid owns null expressions.
 * @evidence contracts/testing.md#execution-ownership This named unit uses existing expression/pose/clip factories and a portable validator; no face, morph buffer or Human asset is created.
 */
export function test_validation_motion_keyframe_expression(): void {
  const motion: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, rest, "linear", makeExpression("happy", 0.5)),
      keyframe(
        1,
        rest,
        "linear",
        makeExpression("happy", 0.5, [{ channel: "jawOpen", weight: 1.5 }]),
      ),
    ],
    1,
  );
  const result: IAutoMovieValidation = validateMotion({
    motion,
    skeleton: createSkeleton(),
  });
  TestValidator.equals("bad keyframe expression fails", result.success, false);
  TestValidator.predicate(
    "range violation under a keyframe expression",
    hasViolation(result, "range", "keyframes[1].expression"),
  );
}
