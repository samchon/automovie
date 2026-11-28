import { AutoMovieEngineRandom } from "@automovie/engine";

import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieEngineRandom.deriveSeed` hashes the UTF-8 bytes of the film seed and each id,
 * each followed by a 0xff separator, with 64-bit FNV-1a.
 *
 * Scenarios:
 *
 * 1. Seed "s" with no id is the hash of the bytes [0x73, 0xff].
 * 2. Ids ["ab", "c"] and ["a", "bc"] differ, the separator keeping their
 *    boundaries.
 * 3. The same inputs give the same seed, and a different film seed another.
 * 4. An ASCII field of 262,144 characters and one named ID hash to the
 *    independently computed byte vector's digest.
 * 5. A supplementary character crossing the chunk boundary stays intact.
 *    A lone surrogate encodes as replacement, and empty fields keep separators.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls deriveSeed on short, long, split-surrogate and empty fields and observes exact digests. ID partitions and repeated or changed input exercise framing and repeatability.
 * @evidence contracts/development/testing.md#independent-expectations The seed-only bytes are 0x73 and 0xff. Independent 64-bit FNV multiplication over complete UTF-8 fields and one separator per field supplies the literal large, split-surrogate and empty digests.
 * @evidence contracts/development/common.md#meaningful-documentation Seed-only and empty fields exercise separators. Partitioned IDs, changed inputs, a long field and a split UTF-16 pair exercise framing, repeatability and encoding.
 */
export function test_engine_random_derive_seed(): void {
  // 1. The bytes it hashes.
  TestValidator.equals(
    "a seed with no id",
    AutoMovieEngineRandom.deriveSeed("s"),
    AutoMovieEngineRandom.hashFnv1a64([0x73, 0xff]),
  );

  // 2. Id boundaries.
  TestValidator.notEquals(
    "boundaries between ids count",
    AutoMovieEngineRandom.deriveSeed("film", "ab", "c"),
    AutoMovieEngineRandom.deriveSeed("film", "a", "bc"),
  );

  // 3. Reproducible identity.
  TestValidator.equals(
    "the same inputs",
    AutoMovieEngineRandom.deriveSeed("film", "hero"),
    AutoMovieEngineRandom.deriveSeed("film", "hero"),
  );
  TestValidator.notEquals(
    "another film seed",
    AutoMovieEngineRandom.deriveSeed("film", "hero"),
    AutoMovieEngineRandom.deriveSeed("other", "hero"),
  );

  TestValidator.equals(
    "a large UTF-8 field preserves its digest",
    AutoMovieEngineRandom.deriveSeed("a".repeat(262144), "shot"),
    "73181c4b6b51e1fb",
  );
  TestValidator.equals(
    "a supplementary character stays paired across chunks",
    AutoMovieEngineRandom.deriveSeed(
      "x".repeat(4095) + "\u{1f3ac}\ud800",
      "\uc9d1",
      "",
    ),
    "2a5ff8a49e4c8534",
  );
  TestValidator.equals(
    "both empty fields retain their separators",
    AutoMovieEngineRandom.deriveSeed("", ""),
    "0a99c907b6f64763",
  );
}
