import { deriveAutoMovieSeed, hashAutoMovieFnv1a64 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `deriveAutoMovieSeed` hashes the UTF-8 bytes of the film seed and each id,
 * each followed by a 0xff separator, with 64-bit FNV-1a.
 *
 * Scenarios:
 *
 * 1. Seed "s" with no id is the hash of the bytes [0x73, 0xff].
 * 2. Ids ["ab", "c"] and ["a", "bc"] differ, the separator keeping their
 *    boundaries.
 * 3. The same inputs give the same seed, and a different film seed another.
 */
export function test_unit_engine_random_derive_seed(): void {
  // 1. The bytes it hashes.
  TestValidator.equals(
    "a seed with no id",
    deriveAutoMovieSeed("s"),
    hashAutoMovieFnv1a64([0x73, 0xff]),
  );

  // 2. Id boundaries.
  TestValidator.notEquals(
    "boundaries between ids count",
    deriveAutoMovieSeed("film", "ab", "c"),
    deriveAutoMovieSeed("film", "a", "bc"),
  );

  // 3. Reproducible identity.
  TestValidator.equals(
    "the same inputs",
    deriveAutoMovieSeed("film", "hero"),
    deriveAutoMovieSeed("film", "hero"),
  );
  TestValidator.notEquals(
    "another film seed",
    deriveAutoMovieSeed("film", "hero"),
    deriveAutoMovieSeed("other", "hero"),
  );
}