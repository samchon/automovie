import { blendPoses, validateMotion } from "@automovie/engine";
import type { IAutoMovieMotion, IAutoMoviePose, IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  createSkeleton,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

/**
 * Observe out-of-ROM blend data reaching the motion validator, against an in-range twin. This unit observes refusal rather than asserting an LLM response or independently measuring every blended angle.
 *
 * Scenarios:
 *
 * 1. Two layers whose blended elbow flexion (300°) exceeds the joint's range
 *    produce a motion that fails validation with a `rom` violation on the
 *    flexion axis: the blend did not clamp it.
 * 2. A blend well inside ROM validates cleanly (the negative twin).
 *
 * @evidence contracts/testing.md#behavioral-verification Blends the authored elbow layers, packages two-stop motions and invokes validateMotion, requiring failed admission with a flexion ROM violation for the overshot case and successful admission for the in-range twin.
 * @evidence contracts/testing.md#independent-expectations Equal 300/300 layers remain 300 beyond the shipped elbow range, while equal 40/80 layers average to 60 within it. Literal success states and the ROM/flexion diagnostic fragment constrain the downstream result independently of blendPoses; shared validation policy is the consumer under observation, not a biological oracle.
 * @evidence contracts/testing.md#distinguishing-cases Retains out-of-range versus in-range equal-weight layers on the same existing rig and one-second constant-pose clips. Exact blend numeric output, custom ROM and mixed-axis composition belong to other units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns both blend-to-motion-to-validation call chains using existing in-memory fixtures. Helpers register no cases and start no viewer, process or native artifact.
 */
export function test_perform_blend_rom(): void {
  const overshot: IAutoMoviePose = blendPoses([
    { pose: makePose([joint("leftLowerArm", { flexion: 300 })]), weight: 1 },
    { pose: makePose([joint("leftLowerArm", { flexion: 300 })]), weight: 1 },
  ]);
  const badMotion: IAutoMovieMotion = makeMotion(
    [keyframe(0, overshot), keyframe(1, overshot)],
    1,
  );
  const bad: IAutoMovieValidation = validateMotion({ motion: badMotion, skeleton: createSkeleton() });
  TestValidator.equals("out-of-ROM blend fails validation", bad.success, false);
  TestValidator.predicate(
    "rom violation on the blended flexion axis",
    hasViolation(bad, "rom", ".flexion"),
  );

  const inRange: IAutoMoviePose = blendPoses([
    { pose: makePose([joint("leftLowerArm", { flexion: 40 })]), weight: 1 },
    { pose: makePose([joint("leftLowerArm", { flexion: 80 })]), weight: 1 },
  ]);
  const goodMotion: IAutoMovieMotion = makeMotion(
    [keyframe(0, inRange), keyframe(1, inRange)],
    1,
  );
  TestValidator.equals(
    "in-range blend validates",
    validateMotion({ motion: goodMotion, skeleton: createSkeleton() }).success,
    true,
  );
}
