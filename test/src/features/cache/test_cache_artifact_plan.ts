import {
  type IAutoMovieArtifactPlan,
  planAutoMovieArtifacts,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The run plan computes exactly the keys nothing stored or earlier provides.
 *
 * Scenarios:
 * 1. An empty store computes each distinct key once and reuses in-run repeats.
 * 2. A second run over the first run's keys computes nothing (null build).
 * 3. One changed key among stored ones computes only that position.
 * 4. verifyEvery samples the first reuse and every n-th after it; 1 verifies every reuse.
 * 5. No keys plan nothing; zero, fractional and negative periods refuse.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls planAutoMovieArtifacts and checks every action and count; recomputing a stored key, reusing an unseen key or sampling the wrong reuse fails.
 * @evidence contracts/development/testing.md#independent-expectations Expected actions are written from the contract by hand: stored or earlier keys reuse, others compute, and sampling counts reuses from zero.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers empty store, full store, a single change, in-run duplicates, periods 1 and 2, the empty run and invalid periods. Content verification of stored entries belongs to the resolution test.
 * @evidence contracts/development/testing.md#execution-ownership A millisecond unit over in-memory keys; no storage, browser or process runs. Discovered by the test runner from its exported name.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and the property each pins.
 */
export function test_cache_artifact_plan(): void {
  const keys: string[] = ["a", "b", "a", "c", "b"];
  const first: IAutoMovieArtifactPlan = planAutoMovieArtifacts(keys, new Set());
  TestValidator.equals("first run", first, {
    actions: ["compute", "compute", "reuse", "compute", "reuse"],
    compute: 3,
    reuse: 2,
    verify: 0,
  });
  TestValidator.equals(
    "null build",
    planAutoMovieArtifacts(keys, new Set(keys)).compute,
    0,
  );
  TestValidator.equals(
    "one change",
    planAutoMovieArtifacts(["a", "x", "c"], new Set(keys)).actions,
    ["reuse", "compute", "reuse"],
  );
  TestValidator.equals(
    "every second reuse",
    planAutoMovieArtifacts(keys, new Set(["a", "b"]), 2).actions,
    ["verify", "reuse", "verify", "compute", "reuse"],
  );
  TestValidator.equals(
    "every reuse",
    planAutoMovieArtifacts(["a", "a"], new Set(), 1),
    { actions: ["compute", "verify"], compute: 1, reuse: 0, verify: 1 },
  );
  TestValidator.equals("empty run", planAutoMovieArtifacts([], new Set()), {
    actions: [],
    compute: 0,
    reuse: 0,
    verify: 0,
  });
  for (const period of [0, 1.5, -1])
    TestValidator.error(
      `period ${period}`,
      (): IAutoMovieArtifactPlan =>
        planAutoMovieArtifacts(keys, new Set(), period),
    );
}
