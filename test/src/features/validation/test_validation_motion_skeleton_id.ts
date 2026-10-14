import type { IAutoMovieValidation } from "@automovie/interface";
import { validateMotion } from "../../../../packages/engine/src/validation/validateMotion";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { createValidMotion } from "../internal/createValidMotion";
import { hasViolation } from "../internal/hasViolation";

/**
 * Exercise the enclosing clip's skeleton identity independently of its supported keyframe poses.
 *
 * Scenarios:
 * 1. A valid clip relabeled to another skeleton id fails with a type violation on its skeleton field.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateMotion with only the enclosing skeleton identity changed and requires a type finding at that field, catching a gate that checks only poses.
 * @evidence contracts/testing.md#independent-expectations A clip targets the supplied rig identity; literal skeleton-2 and skeleton-1 differ, so the expected refusal does not require a sampled pose.
 * @evidence contracts/testing.md#distinguishing-cases Retains supported per-key poses while mismatching the enclosing reference; keyframe_skeleton owns the inverse case and motion_valid owns full identity agreement.
 * @evidence contracts/testing.md#execution-ownership The named unit exercises portable admission through the existing factories, without rig binding, Human assets or a host.
 */
export function test_validation_motion_skeleton_id(): void {
  const result: IAutoMovieValidation = validateMotion({
    motion: { ...createValidMotion(), skeleton: "skeleton-2" },
    skeleton: createSkeleton(),
  });
  TestValidator.equals(
    "mismatched motion skeleton fails",
    result.success,
    false,
  );
  TestValidator.predicate(
    "type violation on motion skeleton",
    hasViolation(result, "type", "$input.skeleton"),
  );
}
