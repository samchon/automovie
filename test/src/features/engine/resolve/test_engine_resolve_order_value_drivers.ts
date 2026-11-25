import { orderValueDrivers } from "@automovie/engine";
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
 */
export function test_engine_resolve_order_value_drivers(): void {
  const ab: IAutoMovieDrivenDriver = driven("b", "a");
  const bc: IAutoMovieDrivenDriver = driven("c", "b");
  TestValidator.predicate(
    "producers first",
    orderValueDrivers([bc, ab])[0] === ab &&
      orderValueDrivers([bc, ab])[1] === bc,
  );
  const x: IAutoMovieDrivenDriver = driven("x", "p");
  const y: IAutoMovieDrivenDriver = driven("y", "q");
  TestValidator.predicate(
    "input order of independents",
    orderValueDrivers([y, x])[0] === y && orderValueDrivers([y, x])[1] === x,
  );
  TestValidator.predicate(
    "a cycle",
    throwsError(
      () => orderValueDrivers([driven("a", "b"), driven("b", "a")]),
      "driver dependency cycle",
    ),
  );
}
