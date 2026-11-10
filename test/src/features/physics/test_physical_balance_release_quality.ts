import { physicalReleasedQuality } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/** A released body adds exactly its declared solver budget above the world's, and nothing otherwise.
 *
 * Scenarios:
 * 1. A released body with a declared quality adds the declared totals minus the world's iterations.
 * 2. Tracking that is not withdrawn adds nothing, even with a declared quality.
 * 3. A declared total below the world's own budget adds nothing rather than a negative count.
 * 4. A released body without a declaration adds nothing.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `physicalReleasedQuality` on in-memory inputs and asserts the returned observations through 4x TestValidator.equals; 4 numbered scenarios (first: A released body with a declared quality adds the declared totals minus the world's iterations.; last: A released body without a declaration adds nothing.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (4 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 4 numbered scenarios (first: A released body with a declared quality adds the declared totals minus the world's iterations.; last: A released body without a declaration adds nothing.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_balance_release_quality`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A released body with a declared quality adds the declared totals minus the world's iterations.).
 */
export function test_physical_balance_release_quality(): void {
  const world: { iterations: number; internalIterations: number } = {
    iterations: 12,
    internalIterations: 1,
  };
  const quality: { iterations: number; internalIterations: number } = {
    iterations: 20,
    internalIterations: 8,
  };
  TestValidator.equals(
    "released totals above the world's budget",
    physicalReleasedQuality({ ...world, quality, released: true }),
    { solver: 8, pgs: 7 },
  );
  TestValidator.equals(
    "tracked body keeps the world's budget",
    physicalReleasedQuality({ ...world, quality, released: false }),
    { solver: 0, pgs: 0 },
  );
  TestValidator.equals(
    "a declaration below the world's budget never subtracts",
    physicalReleasedQuality({
      iterations: 32,
      internalIterations: 16,
      quality,
      released: true,
    }),
    { solver: 0, pgs: 0 },
  );
  TestValidator.equals(
    "no declaration adds nothing",
    physicalReleasedQuality({ ...world, released: true }),
    { solver: 0, pgs: 0 },
  );
}
