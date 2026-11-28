import { AutoMovieEngineDefaultHumanoidRom } from "@automovie/engine";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  crouch
} from "../../../../../packages/motions/src/everyday/internal/crouch";
import {
  crouchAngles
} from "../../../../../packages/motions/src/everyday/internal/crouchAngles";
import { TestValidator } from "@nestia/e2e";

/**
 * `crouchAngles` splits a crouch's knee flexion between the shank, tilted by
 * the crouching ankle's dorsiflexion (no more than the ankle's range) and the
 * heel lift, and the thigh, the rest, refusing a thigh tilt that reaches the
 * hip's flexion range.
 *
 * Scenarios, the crouching ankle's 28 degrees (`crouch.ANKLE`) within the range
 * table's ankle dorsiflexion, and the table's hip flexion:
 *
 * 1. A partial crouch (knee 100) with flat heels tilts the shank 28 and the thigh
 *    72.
 * 2. A full crouch (knee 150) with raised heels tilts the shank 28 + 30 = 58 and
 *    the thigh 92.
 * 3. A full crouch with flat heels tilts the thigh 122, past the hip's range, and
 *    is refused on `depth`, its knee kept under the range plus 28.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Crouch angles allocate knee flexion across shank and thigh within the ankle and hip ranges.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the angle splitter at a partial crouch and a full crouch on the toes.
 * @evidence contracts/development/testing.md#independent-expectations The flexion sum and heel-up shank tilt are geometric relationships. Limiting ankle travel leaves the remaining flexion to the thigh.
 */
export async function test_motions_everyday_crouch(): Promise<void> {
  const hip: number = AutoMovieEngineDefaultHumanoidRom.leftUpperLeg!.flexion!.max;
  const ankle: number = Math.min(
    crouch.ANKLE,
    AutoMovieEngineDefaultHumanoidRom.leftFoot!.flexion!.max,
  );
  const partial: crouchAngles.IAngles = crouchAngles(
    crouch.KNEE.partial,
    crouch.ANKLE,
    0,
    "partial",
    "flat",
  );
  TestValidator.equals(
    "a partial crouch",
    [
      partial.dorsiflexion,
      partial.shankTilt,
      partial.thighTilt,
      partial.hipRange,
    ],
    [ankle, ankle, crouch.KNEE.partial - ankle, hip],
  );
  const raised: crouchAngles.IAngles = crouchAngles(
    crouch.KNEE.full,
    crouch.ANKLE,
    crouch.HEEL,
    "full",
    "up",
  );
  TestValidator.equals(
    "a full crouch on the toes",
    [raised.shankTilt, raised.thighTilt],
    [ankle + crouch.HEEL, crouch.KNEE.full - ankle - crouch.HEEL],
  );
  let refusal: AutoMovieMotionHumanRefusal | undefined;
  try {
    crouchAngles(crouch.KNEE.full, crouch.ANKLE, 0, "full", "flat");
  } catch (error: unknown) {
    if (error instanceof AutoMovieMotionHumanRefusal) refusal = error;
  }
  TestValidator.predicate(
    `flat heels at full depth refused (${refusal?.axis})`,
    crouch.KNEE.full - ankle >= hip && refusal?.axis === "depth",
  );
}
