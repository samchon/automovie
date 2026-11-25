import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import {
  HumanRefusal,
  crouch,
  crouchAngles,
} from "@automovie/motions/internal";
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
 */
export async function test_unit_motions_everyday_crouch(): Promise<void> {
  const hip: number = DEFAULT_HUMANOID_ROM.leftUpperLeg!.flexion!.max;
  const ankle: number = Math.min(
    crouch.ANKLE,
    DEFAULT_HUMANOID_ROM.leftFoot!.flexion!.max,
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
  let refusal: HumanRefusal | undefined;
  try {
    crouchAngles(crouch.KNEE.full, crouch.ANKLE, 0, "full", "flat");
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) refusal = error;
  }
  TestValidator.predicate(
    `flat heels at full depth refused (${refusal?.axis})`,
    crouch.KNEE.full - ankle >= hip && refusal?.axis === "depth",
  );
}
