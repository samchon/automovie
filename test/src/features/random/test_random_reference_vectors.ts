import {
  createAutoMovieRandom,
  deriveAutoMovieSeed,
  hashAutoMovieFnv1a64,
  philoxAutoMovie4x32,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/** The pinned generator reproduces its published algorithms and stays pure, seekable and stream-independent.
 *
 * Scenarios:
 * 1. Philox4x32-10 reproduces the Random123 known-answer vectors for zero, all-ones and pi-digit counters and keys.
 * 2. 64-bit FNV-1a reproduces the reference hashes of "", "a" and "foobar".
 * 3. A stream's values are pure in their index: reading in reverse order gives the same values, and the float lies in [0, 1).
 * 4. Derived seeds are stable for stable ids, separate ids by a terminator, and change with any id; streams keyed by different ids differ.
 * 5. A malformed seed and a negative or fractional index are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `createAutoMovieRandom`, `deriveAutoMovieSeed`, `hashAutoMovieFnv1a64`, `philoxAutoMovie4x32` on in-memory inputs and asserts the returned observations through 7x TestValidator.equals, 3x TestValidator.predicate; 5 numbered scenarios (first: Philox4x32-10 reproduces the Random123 known-answer vectors for zero, all-ones and pi-digit counters and keys.; last: A malformed seed and a negative or fractional index are refused.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (7 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 5 numbered scenarios (first: Philox4x32-10 reproduces the Random123 known-answer vectors for zero, all-ones and pi-digit counters and keys.; last: A malformed seed and a negative or fractional index are refused.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_random_reference_vectors`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Philox4x32-10 reproduces the Random123 known-answer vectors for zero, all-ones and pi-digit counters and keys.).
 */
export function test_random_reference_vectors(): void {
  const hex = (words: number[]): string[] =>
    words.map((w: number): string => w.toString(16).padStart(8, "0"));
  TestValidator.equals(
    "Philox4x32-10 zero vector",
    hex(philoxAutoMovie4x32([0, 0, 0, 0], [0, 0])),
    ["6627e8d5", "e169c58d", "bc57ac4c", "9b00dbd8"],
  );
  TestValidator.equals(
    "Philox4x32-10 all-ones vector",
    hex(
      philoxAutoMovie4x32(
        [0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff],
        [0xffffffff, 0xffffffff],
      ),
    ),
    ["408f276d", "41c83b0e", "a20bc7c6", "6d5451fd"],
  );
  TestValidator.equals(
    "Philox4x32-10 pi vector",
    hex(
      philoxAutoMovie4x32(
        [0x243f6a88, 0x85a308d3, 0x13198a2e, 0x03707344],
        [0xa4093822, 0x299f31d0],
      ),
    ),
    ["d16cfe09", "94fdcceb", "5001e420", "24126ea1"],
  );
  const bytes = (text: string): Uint8Array => new TextEncoder().encode(text);
  TestValidator.equals(
    "FNV-1a 64 reference hashes",
    ["", "a", "foobar"].map((t: string): string =>
      hashAutoMovieFnv1a64(bytes(t)),
    ),
    ["cbf29ce484222325", "af63dc4c8601ec8c", "85944171f73967e8"],
  );

  // Purity and seeking.
  const random = createAutoMovieRandom(deriveAutoMovieSeed("film", "noise"));
  const forward: number[] = [0, 1, 2, 3, 4, 2 ** 32, 2 ** 40].map(random.float);
  const backward: number[] = [2 ** 40, 2 ** 32, 4, 3, 2, 1, 0]
    .map(random.float)
    .reverse();
  TestValidator.equals("order-free values", backward, forward);
  TestValidator.predicate(
    "unit interval",
    forward.every((x: number): boolean => x >= 0 && x < 1) &&
      new Set(forward).size === forward.length,
  );

  // Seeds and stream independence.
  TestValidator.equals(
    "stable derived seed",
    deriveAutoMovieSeed("film", "a", "b"),
    deriveAutoMovieSeed("film", "a", "b"),
  );
  TestValidator.predicate(
    "id boundaries and every id matter",
    new Set([
      deriveAutoMovieSeed("film", "ab", "c"),
      deriveAutoMovieSeed("film", "a", "bc"),
      deriveAutoMovieSeed("film", "a", "b"),
      deriveAutoMovieSeed("other", "a", "b"),
    ]).size === 4,
  );
  const left = random.stream("left");
  const right = random.stream("right");
  TestValidator.predicate(
    "keyed streams differ and repeat",
    left.uint32(0) !== right.uint32(0) &&
      left.seed === random.stream("left").seed &&
      left.uint32(7) === random.stream("left").uint32(7),
  );

  // Refusals.
  const refusals: string[] = [];
  for (const [label, run] of [
    ["short seed", (): unknown => createAutoMovieRandom("abc")],
    ["negative index", (): unknown => random.float(-1)],
    ["fractional index", (): unknown => random.uint32(0.5)],
  ] as const)
    try {
      run();
      refusals.push(`${label} accepted`);
    } catch {}
  TestValidator.equals("refusals", refusals, []);
}
