import { validDigest } from "@automovie/render/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `validDigest` accepts `sha256:` and 64 lowercase hexadecimal digits only.
 *
 * Scenarios:
 *
 * 1. 64 lowercase digits are valid.
 * 2. Uppercase, 63 digits, 65 digits, another algorithm and a bare hash are
 *    not.
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