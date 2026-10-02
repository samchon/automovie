import { linearToSrgbByte, srgbByteToLinear } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * The shared 8-bit sRGB transfer pair agrees with IEC 61966-2-1 and inverts itself.
 *
 * Scenarios:
 * 1. The end codes decode to exactly 0 and 1, code 128 decodes to the standard's
 *    0.21586, and codes 10 and 11 fall on the linear and power segments on
 *    either side of the 0.04045 breakpoint.
 * 2. Encoding the decoded value returns every one of the 256 codes unchanged.
 * 3. Encoding saturates below 0 and above 1, rounds to the nearest code, and
 *    decoding is strictly increasing.
 */
export const test_human_srgb_byte_transfer = (): void => {
  TestValidator.equals("black", srgbByteToLinear(0), 0);
  TestValidator.equals("white", srgbByteToLinear(255), 1);
  TestValidator.predicate(
    "mid grey follows the power segment",
    nclose(srgbByteToLinear(128), 0.2158605, 1e-7),
  );
  TestValidator.predicate(
    "code 10 is on the linear segment",
    nclose(srgbByteToLinear(10), 10 / 255 / 12.92, 1e-12),
  );
  TestValidator.predicate(
    "code 11 is on the power segment",
    nclose(srgbByteToLinear(11), 0.003346536, 1e-8),
  );
  const codes = Array.from({ length: 256 }, (_, code) => code);
  TestValidator.equals(
    "every code round trips",
    codes.map((code) => linearToSrgbByte(srgbByteToLinear(code))),
    codes,
  );
  TestValidator.equals("below zero saturates", linearToSrgbByte(-0.5), 0);
  TestValidator.equals("above one saturates", linearToSrgbByte(2), 255);
  TestValidator.equals("linear segment rounds", linearToSrgbByte(0.001), 3);
  TestValidator.equals("power segment rounds", linearToSrgbByte(0.5), 188);
  TestValidator.predicate(
    "decoding increases with the code",
    codes.slice(1).every((code) => srgbByteToLinear(code) > srgbByteToLinear(code - 1)),
  );
};
