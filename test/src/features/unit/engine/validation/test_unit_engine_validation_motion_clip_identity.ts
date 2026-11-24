import { validateMotion } from "@automovie/engine";
import type { IAutoMovieMotion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../../internal/createSkeleton";
import { createValidMotion } from "../../../internal/createValidMotion";
import { hasViolation } from "../../../internal/hasViolation";

/**
 * Rig selection is validated at the clip envelope.
 *
 * Scenarios:
 *
 * 1. Either boolean repetition value admits the authored elbow movement.
 * 2. A different rig identifies the failing field.
 */
export function test_unit_engine_validation_motion_clip_identity(): void {
  const motion = createValidMotion();
  const skeleton = createSkeleton();
  for (const loop of [true, false])
    TestValidator.equals(
      `loop ${loop} admitted`,
      validateMotion({ skeleton, motion: { ...motion, loop } }).success,
      true,
    );
  const cases: Array<[Partial<IAutoMovieMotion>, string]> = [
    [{ skeleton: skeleton.id + "-other" }, "$input.skeleton"],
  ];
  for (const [change, path] of cases) {
    const result = validateMotion({
      skeleton,
      motion: { ...motion, ...change },
    });
    TestValidator.predicate(
      path,
      !result.success && hasViolation(result, "type", path),
    );
  }
}
