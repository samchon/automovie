import { travelMotion } from "@automovie/engine";
import type {
  IAutoMovieMotion,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { keyframe, makeMotion, makePose } from "../../../features/internal/fixtures";
import { nclose, throwsError } from "../../../features/internal/predicates";

/**
 * Repetition rotates the local root into the heading before applying world velocity.
 *
 * Scenarios:
 * 1. Two cycles turn local X toward negative Z and accumulate velocity across the seam.
 * 2. An absent root gets an independently owned identity at each key and each invocation.
 * 3. Invalid counts, nonfinite transforms and unrepresentable times or positions are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the placed root, easing and clock.
 * @evidence contracts/development/testing.md#independent-expectations A quarter turn sends X to negative Z.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares missing and authored local roots.
 * @evidence contracts/development/testing.md#execution-ownership Uses two small in-memory clips.
 * @evidence contracts/development/common.md#meaningful-documentation Lists placement, ownership and admission.
 */
export function test_motion_gait_travel_clip(): void {
  const quarter: IAutoMovieQuaternion = {
    x: 0,
    y: Math.SQRT1_2,
    z: 0,
    w: Math.SQRT1_2,
  };
  const velocity: IAutoMovieVector3 = { x: 2, y: 0, z: 0 };
  const root: IAutoMovieTransform = {
    translation: { x: 1, y: 1, z: 0 },
    rotation: quarter,
    scale: { x: 1, y: 1, z: 1 },
  };
  const clip = (pose: ReturnType<typeof makePose>): IAutoMovieMotion =>
    makeMotion(
      [keyframe(0, pose, "easeIn"), keyframe(1, pose, "step")],
      1,
      true,
    );
  const base = clip(makePose([]));
  const authored = travelMotion(
    "placed",
    clip(makePose([], root)),
    2,
    velocity,
    quarter,
  );
  TestValidator.equals(
    "owned clock and incoming easing",
    authored.keyframes.map((key) => [key.time, key.easing]),
    [
      [0, "easeIn"],
      [1, "easeIn"],
      [2, "step"],
    ],
  );
  TestValidator.equals(
    "placed envelope",
    [authored.duration, authored.skeleton, authored.loop],
    [2, base.skeleton, false],
  );
  for (const key of authored.keyframes) {
    const placed = key.pose.root!;
    TestValidator.predicate(
      "rotated sway plus world travel",
      nclose(placed.translation.x, velocity.x * key.time) &&
        nclose(placed.translation.y, 1) &&
        nclose(placed.translation.z, -1),
    );
    TestValidator.predicate(
      "two quarter turns compose into a half turn",
      nclose(placed.rotation.w, 0) && nclose(placed.rotation.y, 1),
    );
  }
  const plain = () => travelMotion("plain", base, 1, velocity);
  const placed = plain();
  placed.keyframes[0]!.pose.root!.rotation.w = 0;
  placed.keyframes[0]!.pose.root!.scale.x = 0;
  for (const key of [placed.keyframes[1]!, plain().keyframes[0]!])
    TestValidator.equals(
      "identity belongs to the returned frame",
      [key.pose.root!.rotation.w, key.pose.root!.scale.x],
      [1, 1],
    );
  for (const count of [NaN, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])
    TestValidator.predicate(
      "invalid repetition",
      throwsError(
        () => travelMotion("count", base, count, velocity),
        "travel cycles",
      ),
    );
  for (const axis of ["x", "y", "z"] as const)
    TestValidator.predicate(
      "velocity components must be finite",
      throwsError(() =>
        travelMotion("velocity", base, 1, { ...velocity, [axis]: Infinity }),
      ),
    );
  for (const axis of ["x", "y", "z", "w"] as const)
    TestValidator.predicate(
      "heading components must be finite",
      throwsError(() =>
        travelMotion("facing", base, 1, velocity, { ...quarter, [axis]: NaN }),
      ),
    );
  const huge: IAutoMovieMotion = makeMotion(
    [keyframe(0, makePose([])), keyframe(1e308, makePose([]))],
    1e308,
  );
  TestValidator.predicate(
    "finite base duration refuses overflowing composite duration",
    throwsError(
      (): IAutoMovieMotion =>
        travelMotion("durationOverflow", huge, 2, { x: 0, y: 0, z: 0 }),
      "travel duration",
    ),
  );
  TestValidator.predicate(
    "finite velocity and time refuse overflowing root coordinates",
    throwsError(
      (): IAutoMovieMotion =>
        travelMotion("positionOverflow", huge, 1, { x: 2, y: 0, z: 0 }),
      "travel root translation",
    ),
  );
  const dense: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([])),
      keyframe(1, makePose([])),
      keyframe(1e16, makePose([])),
    ],
    1e16,
  );
  TestValidator.predicate(
    "finite cycle offsets refuse a lost interior clock increment",
    throwsError(
      (): IAutoMovieMotion =>
        travelMotion("lostIncrement", dense, 2, { x: 0, y: 0, z: 0 }),
      "travel keyframe times",
    ),
  );
}
