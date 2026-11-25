import { toRigAngle } from "@automovie/engine";
import type { IAutoMovieAxisFrame } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one subtract and divide. */
const ROUNDING: number = 1e-12;

/** A reversed axis whose clinical zero sits at rig angle 10 degrees. */
const FRAME: IAutoMovieAxisFrame = { sign: -1, neutral: 10 };

/**
 * `toRigAngle` is the inverse of the clinical map: `(clinical - neutral) /
 * sign`.
 *
 * Scenarios:
 *
 * 1. Clinical -20 under sign -1, neutral 10 is (-20 - 10) / -1 = 30.
 * 2. No frame leaves the angle, and null stays null.
 * 3. The prepared reader answers the same on a repeated frame.
 */
export function test_engine_rom_to_rig_angle(): void {
  TestValidator.predicate(
    "neutral and sign",
    nclose(toRigAngle(-20, FRAME) ?? NaN, 30, ROUNDING),
  );
  TestValidator.predicate(
    "identity and null",
    toRigAngle(30, undefined) === 30 && toRigAngle(null, FRAME) === null,
  );
  const read: ReturnType<typeof toRigAngle.prepare> = toRigAngle.prepare();
  TestValidator.predicate(
    "the prepared reader",
    nclose(read(-20, FRAME) ?? NaN, 30, ROUNDING) &&
      nclose(read(10, FRAME) ?? NaN, 0, ROUNDING) &&
      read(5, undefined) === 5 &&
      read(null, FRAME) === null,
  );
}
