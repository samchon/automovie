import { createMeshEdgeKey } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * `createMeshEdgeKey` encodes an ordered vertex pair injectively.
 *
 * Scenarios:
 *
 * 1. A population of 10 gives from * 10 + to: (2, 3) is 23 and (0, 0) is 0.
 * 2. A population of 2^27 squares past the safe integers and keys the pair as
 *    `from/to`.
 * 3. A negative population is refused.
 * 4. Seven identities: every ordered pair (including self and reversed) keys to
 *    from * 7 + to and all 49 keys are distinct. At
 *    floor(sqrt(MAX_SAFE_INTEGER)) the key stays numeric and exact; at 2^27 the
 *    pair near 2^54 would collapse in doubles yet keys stay distinct; one above
 *    the boundary uses delimited keys that keep adjacent endpoints and
 *    direction distinct. Counts 0 and 1 prepare; MAX_SAFE_INTEGER prepares
 *    exact directed keys; its next count, and a negative count, are refused
 *    with "nonnegative safe vertex count".
 */
export function test_unit_engine_math_create_mesh_edge_key(): void {
  const small = createMeshEdgeKey(10);
  TestValidator.equals("pair", small(2, 3), 23);
  TestValidator.equals("reverse differs", small(3, 2), 32);
  TestValidator.equals("zero", small(0, 0), 0);
  TestValidator.equals("large", createMeshEdgeKey(2 ** 27)(1, 2), "1/2");
  TestValidator.predicate(
    "negative",
    throwsError(() => createMeshEdgeKey(-1)),
  );
  const seven = createMeshEdgeKey(7);
  const keys: Set<number | string> = new Set<number | string>();
  for (let low: number = 0; low < 7; ++low)
    for (let high: number = 0; high < 7; ++high) {
      TestValidator.equals("pair", seven(low, high), low * 7 + high);
      keys.add(seven(low, high));
    }
  TestValidator.equals("distinct", keys.size, 49);
  const limit: number = Math.floor(Math.sqrt(Number.MAX_SAFE_INTEGER));
  TestValidator.equals(
    "numeric boundary",
    createMeshEdgeKey(limit)(limit - 2, limit - 1),
    Number(BigInt(limit - 2) * BigInt(limit) + BigInt(limit - 1)),
  );
  const population: number = 2 ** 27;
  const low: number = population - 5;
  const exactFirst: bigint =
    BigInt(low) * BigInt(population) + BigInt(population - 4);
  const exactSecond: bigint =
    BigInt(low) * BigInt(population) + BigInt(population - 3);
  TestValidator.predicate(
    "doubles would collapse",
    exactFirst !== exactSecond && Number(exactFirst) === Number(exactSecond),
  );
  const wide = createMeshEdgeKey(population);
  TestValidator.predicate(
    "keys stay distinct",
    wide(low, population - 4) !== wide(low, population - 3),
  );
  const large: number = limit + 1;
  const fallback = createMeshEdgeKey(large);
  TestValidator.equals(
    "delimited",
    [fallback(large - 3, large - 2), fallback(large - 3, large - 1)],
    [`${large - 3}/${large - 2}`, `${large - 3}/${large - 1}`],
  );
  TestValidator.predicate(
    "directed",
    fallback(large - 3, large - 1) !== fallback(large - 1, large - 3),
  );
  createMeshEdgeKey(0);
  TestValidator.equals("one identity", createMeshEdgeKey(1)(0, 0), 0);
  const maximum: number = Number.MAX_SAFE_INTEGER;
  const widest = createMeshEdgeKey(maximum);
  TestValidator.equals(
    "maximum",
    [widest(0, maximum - 1), widest(maximum - 1, 0)],
    [`0/${maximum - 1}`, `${maximum - 1}/0`],
  );
  for (const count of [-1, maximum + 1])
    TestValidator.predicate(
      "invalid count",
      throwsError(
        () => createMeshEdgeKey(count),
        ["nonnegative safe vertex count"],
      ),
    );
}
