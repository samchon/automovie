import {
  validDigest
} from "../../../../../packages/render/src/film/internal/validDigest";
import { TestValidator } from "@nestia/e2e";

/**
 * `validDigest` accepts `sha256:` and 64 lowercase hexadecimal digits only.
 *
 * Scenarios:
 *
 * 1. 64 lowercase digits are valid.
 * 2. Uppercase, 63 digits, 65 digits, another algorithm and a bare hash are
 *    not.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Admits exactly lowercase SHA-256 identity strings with the algorithm prefix and fixed length.
 * @evidence contracts/development/testing.md#behavioral-verification Calls digest admission on a valid value and separate uppercase, length, algorithm and prefix variants.
 * @evidence contracts/development/testing.md#independent-expectations The literal 64-character lowercase contract isolates each invalid field independently.
 */
export function test_render_film_valid_digest(): void {
  const hex: string = "0123456789abcdef".repeat(4);
  TestValidator.equals("valid", validDigest(`sha256:${hex}`), true);
  TestValidator.equals("upper", validDigest(`sha256:${hex.toUpperCase()}`), false);
  TestValidator.equals("short", validDigest(`sha256:${hex.slice(1)}`), false);
  TestValidator.equals("long", validDigest(`sha256:${hex}0`), false);
  TestValidator.equals("algorithm", validDigest(`sha512:${hex}`), false);
  TestValidator.equals("bare", validDigest(hex), false);
}