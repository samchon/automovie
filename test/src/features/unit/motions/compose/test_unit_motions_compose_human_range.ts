import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import {
  AutoMovieMotionHumanRange,
  AutoMovieMotionHumanReach,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** Rounding of one product, degrees. */
const ROUNDING: number = 1e-12;

/**
 * `AutoMovieMotionHumanRange` turns an amount into degrees: a level is a share
 * of the way from rest to the named motion's limit in `DEFAULT_HUMANOID_ROM`
 * (flexion its `flexion.max`, extension its `flexion.min`, and so on), signed
 * as the clinical angle; a level may be scaled within [0.5, 1.5] and no further
 * than the whole range; explicit degrees are a sourced magnitude signed by the
 * motion and no larger than the limit; a lean is a share of the reach's lean
 * limit, a shift a share of the stature.
 *
 * Scenarios:
 *
 * 1. The levels' shares, and a light level scaled by 1.2 at 0.3.
 * 2. A scale of 2, and a full level scaled by 1.2 past the whole range, are
 *    refused.
 * 3. A light neck flexion is 0.25 of its flexion limit; a half extension is half
 *    the negative minimum; ten explicit degrees of extension are −10.
 * 4. Explicit degrees past the limit, or with no source, and a motion the joint
 *    has no range in, are refused.
 * 5. A half lean is half the lean limit.
 */
export function test_unit_motions_compose_human_range(): void {
  // 1. Shares.
  TestValidator.equals(
    "the level shares",
    AutoMovieMotionHumanRange.LEVEL_NAMES.map(
      (l: (typeof AutoMovieMotionHumanRange.LEVEL_NAMES)[number]): number =>
        AutoMovieMotionHumanRange.share(l),
    ),
    [0.1, 0.25, 0.5, 0.75, 0.9],
  );
  TestValidator.predicate(
    "a scaled level",
    nclose(
      AutoMovieMotionHumanRange.share({ level: "light", scale: 1.2 }),
      0.3,
      ROUNDING,
    ),
  );

  // 2. Scale refusals.
  TestValidator.predicate(
    "a scale out of bounds or past the range is refused",
    throwsError(
      (): unknown =>
        AutoMovieMotionHumanRange.share({ level: "light", scale: 2 }),
      "use the level half",
    ) &&
      throwsError((): unknown =>
        AutoMovieMotionHumanRange.share({ level: "full", scale: 1.2 }),
      ),
  );

  // 3. Degrees.
  const neck: { min: number; max: number } =
    DEFAULT_HUMANOID_ROM.neck!.flexion!;
  TestValidator.predicate(
    "degrees from the joint's own range",
    nclose(
      AutoMovieMotionHumanRange.degrees("neck", "flexion", "light"),
      0.25 * neck.max,
      ROUNDING,
    ) &&
      nclose(
        AutoMovieMotionHumanRange.degrees("neck", "extension", "half"),
        0.5 * neck.min,
        ROUNDING,
      ) &&
      AutoMovieMotionHumanRange.degrees("neck", "extension", {
        degrees: 10,
        source: "a cue",
      }) === -10,
  );

  // 4. Refusals.
  TestValidator.predicate(
    "explicit degrees past the limit or unsourced, and a missing range, are refused",
    throwsError((): unknown =>
      AutoMovieMotionHumanRange.degrees("neck", "flexion", {
        degrees: 500,
        source: "a cue",
      }),
    ) &&
      throwsError(
        (): unknown =>
          AutoMovieMotionHumanRange.degrees("neck", "flexion", {
            degrees: 5,
            source: " ",
          }),
        "state their source",
      ) &&
      throwsError(
        (): unknown =>
          AutoMovieMotionHumanRange.degrees(
            "leftLowerLeg",
            "abduction",
            "light",
          ),
        "has no range",
      ),
  );

  // 5. Lean.
  TestValidator.predicate(
    "a lean",
    nclose(
      AutoMovieMotionHumanRange.lean("half"),
      0.5 * AutoMovieMotionHumanReach.LEAN_LIMIT,
      ROUNDING,
    ),
  );
}
