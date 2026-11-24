import { linearColorToSrgbHex, srgbHexToLinearColor } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/predicates";

/**
 * `srgbHexToLinearColor` decodes a #RRGGBB swatch to linear light and
 * `linearColorToSrgbHex` encodes it back.
 *
 * Scenarios:
 *
 * 1. Black and white decode to 0 and 1 with alpha 1.
 * 2. #808080 decodes to 0.2158605 (IEC 61966-2-1) and a mixed-case swatch is
 *    normalized.
 * 3. Encoding clamps out-of-range components: (2, -1, 0) is #ff0000.
 * 4. A three-digit swatch is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the decode and encode and asserts channel values, the normalized label, clamping and the refusal.
 * @evidence contracts/development/testing.md#independent-expectations The IEC 61966-2-1 transfer function gives 0.2158605 for 0x80/255 and 0 and 1 at the ends.
 * @evidence contracts/development/testing.md#distinguishing-cases Valid versus malformed swatches and in-range versus clamped components are the adjacent cases.
 * @evidence contracts/development/testing.md#execution-ownership The named test_unit_engine_math_srgb_hex entry runs portable in-memory literals with no host and no dynamically registered cases.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_unit_engine_math_srgb_hex(): void {
  const black = srgbHexToLinearColor("#000000");
  TestValidator.equals(
    "black",
    [black.r, black.g, black.b, black.a],
    [0, 0, 0, 1],
  );
  const white = srgbHexToLinearColor("#FFFFFF");
  TestValidator.equals(
    "white",
    [white.r, white.g, white.b, white.a],
    [1, 1, 1, 1],
  );
  TestValidator.equals("normalized", white.hex, "#ffffff");
  TestValidator.predicate(
    "mid grey",
    nclose(srgbHexToLinearColor("#808080").r, 0.2158605, 1e-6),
  );
  TestValidator.equals(
    "clamp",
    linearColorToSrgbHex({ r: 2, g: -1, b: 0 }),
    "#ff0000",
  );
  TestValidator.predicate(
    "short swatch",
    throwsError(() => srgbHexToLinearColor("#fff")),
  );
}
