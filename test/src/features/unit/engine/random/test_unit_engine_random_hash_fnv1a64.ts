import { hashAutoMovieFnv1a64 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `hashAutoMovieFnv1a64` is the 64-bit FNV-1a hash (Fowler, Noll and Vo,
 * draft-eastlake-fnv): the empty input returns the offset basis and the
 * published test vectors hold.
 *
 * Scenarios:
 *
 * 1. No bytes: the offset basis cbf29ce484222325.
 * 2. "a": af63dc4c8601ec8c, the draft's vector.
 * 3. "foobar": 85944171f73967e8, the draft's vector.
 * 4. A byte above 0xff is reduced to its low eight bits: 0x161 hashes as "a".
 */
export function test_unit_engine_random_hash_fnv1a64(): void {
  const ascii = (text: string): number[] =>
    [...text].map((ch: string): number => ch.charCodeAt(0));

  // 1-3. The published vectors.
  TestValidator.equals("empty", hashAutoMovieFnv1a64([]), "cbf29ce484222325");
  TestValidator.equals(
    "a",
    hashAutoMovieFnv1a64(ascii("a")),
    "af63dc4c8601ec8c",
  );
  TestValidator.equals(
    "foobar",
    hashAutoMovieFnv1a64(ascii("foobar")),
    "85944171f73967e8",
  );

  // 4. Only the low byte enters.
  TestValidator.equals(
    "a byte's low eight bits",
    hashAutoMovieFnv1a64([0x161]),
    hashAutoMovieFnv1a64([0x61]),
  );
}
