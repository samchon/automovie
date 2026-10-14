import type {
  IAutoMovieMotion,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateMotion } from "../../../../packages/engine/src/validation/validateMotion";
import { createSkeleton } from "../internal/createSkeleton";
import { joint } from "../internal/joint";
import { keyframe } from "../internal/keyframe";
import { makeMotion } from "../internal/makeMotion";
import { makePose } from "../internal/makePose";

/**
 * Exercise admission of a joint first appearing in a later keyframe while a shared elbow moves within the speed policy.
 *
 * Scenarios:
 * 1. A one-second clip moves its elbow from 0 to 30 degrees and introduces a shoulder at 20 degrees in the second key; the clip validates.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateMotion and requires success for an admitted partial-joint clip, catching a gate that rejects first-appearing joints outright.
 * @evidence contracts/testing.md#independent-expectations Joints need not repeat in every keyframe and the authored angles satisfy default constraints. A mistaken zero baseline would also pass this low-speed input, so it does not prove that every synthetic-baseline calculation is absent.
 * @evidence contracts/testing.md#distinguishing-cases Retains a shared moving elbow and newly listed shoulder; angular_speed owns excessive shared-axis motion and motion_valid owns an unchanged joint population.
 * @evidence contracts/testing.md#execution-ownership This named portable unit uses existing factories and no sampled movement, Human asset, host or dynamic cases.
 */
export function test_validation_motion_new_bone(): void {
  const motion: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("leftLowerArm", { flexion: 0 })])),
      keyframe(
        1,
        makePose([
          joint("leftLowerArm", { flexion: 30 }),
          joint("leftUpperArm", { flexion: 20 }),
        ]),
      ),
    ],
    1,
  );
  const result: IAutoMovieValidation = validateMotion({
    motion,
    skeleton: createSkeleton(),
  });
  TestValidator.equals(
    "a newly-introduced bone does not trip the speed check",
    result.success,
    true,
  );
}
