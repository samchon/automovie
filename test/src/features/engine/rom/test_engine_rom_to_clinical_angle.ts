import { toClinicalAngle } from "@automovie/engine";
import type { IAutoMovieAxisFrame } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one multiply and add. */
const ROUNDING: number = 1e-12;

/** A reversed axis whose clinical zero sits at rig angle 10 degrees. */
const FRAME: IAutoMovieAxisFrame = { sign: -1, neutral: 10 };

/**
 * `toClinicalAngle` maps a rig angle to the clinical one: `sign * rig +
 * neutral`, with null staying null and no frame meaning identity.
 *
 * Scenarios:
 *
 * 1. Rig 30 under sign -1, neutral 10 is -30 + 10 = -20.
 * 2. No frame leaves the angle, and null stays null.
 * 3. The prepared reader answers the same on a repeated frame.
 */
export function test_engine_rom_to_clinical_angle(): void {
  TestValidator.predicate(
    "sign and neutral",
    nclose(toClinicalAngle(30, FRAME) ?? NaN, -20, ROUNDING),
  );
  TestValidator.predicate(
    "identity and null",
    toClinicalAngle(30, undefined) === 30 &&
      toClinicalAngle(null, FRAME) === null,
  );
  const read: ReturnType<typeof toClinicalAngle.prepare> =
    toClinicalAngle.prepare();
  TestValidator.predicate(
    "the prepared reader",
    nclose(read(30, FRAME) ?? NaN, -20, ROUNDING) &&
      nclose(read(0, FRAME) ?? NaN, 10, ROUNDING) &&
      read(5, undefined) === 5 &&
      read(null, FRAME) === null,
  );
}
