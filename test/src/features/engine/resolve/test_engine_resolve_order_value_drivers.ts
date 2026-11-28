import { AutoMovieEngineResolve } from "@automovie/engine";
import type { IAutoMovieDrivenDriver } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/** A driven driver writing one node's translation from another's. */
const driven: (output: string, source: string) => IAutoMovieDrivenDriver = (
  output: string,
  source: string,
): IAutoMovieDrivenDriver => ({
  type: "driven",
  output: { kind: "node", node: output, path: "translation" },
  source: { kind: "node", node: source, path: "translation" },
});

/**
 * `orderValueDrivers` orders drivers so each runs after the drivers that write
 * its source channel.
 *
 * Scenarios:
 *
 * 1. B -> C given before A -> B is reordered to A -> B first.
 * 2. Independent drivers keep their input order.
 * 3. A driver cycle is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names producer-first ordering, stable independent order, and refusal of a dependency cycle.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `orderValueDrivers` with typed driven-channel pairs and compares their returned identities and positions. A reciprocal pair must throw the cycle diagnostic.
 * @evidence contracts/development/testing.md#independent-expectations A → B must precede B → C because the latter reads B. The two disjoint producer/source pairs preserve the given y, x order. Reciprocal A and B assignments form a cycle with no valid first operation.
 */
export function test_engine_resolve_order_value_drivers(): void {
  const ab: IAutoMovieDrivenDriver = driven("b", "a");
  const bc: IAutoMovieDrivenDriver = driven("c", "b");
  TestValidator.predicate(
    "producers first",
    AutoMovieEngineResolve.orderValueDrivers([bc, ab])[0] === ab &&
      AutoMovieEngineResolve.orderValueDrivers([bc, ab])[1] === bc,
  );
  const x: IAutoMovieDrivenDriver = driven("x", "p");
  const y: IAutoMovieDrivenDriver = driven("y", "q");
  TestValidator.predicate(
    "input order of independents",
    AutoMovieEngineResolve.orderValueDrivers([y, x])[0] === y && AutoMovieEngineResolve.orderValueDrivers([y, x])[1] === x,
  );
  TestValidator.predicate(
    "a cycle",
    throwsError(
      () => AutoMovieEngineResolve.orderValueDrivers([driven("a", "b"), driven("b", "a")]),
      "driver dependency cycle",
    ),
  );
}
