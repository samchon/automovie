import { createMeshEdgeKey } from "@automovie/engine/math/createMeshEdgeKey";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Edge incidence requires an injective identity at every supported population,
 * including populations whose pair arithmetic exceeds double precision.
 *
 * Scenarios:
 * 1. All ordered pairs of seven identities, including self and reversed pairs,
 *    are distinct and reproduce the
 *    independent integer base encoding; repeated queries are deterministic.
 * 2. The integer square-root boundary of MAX_SAFE_INTEGER uses numeric keys;
 *    the next count uses exact delimited keys for adjacent large endpoints.
 *    Two larger pairs that rounded double arithmetic collapses remain distinct.
 * 3. Zero and one populations prepare without a spurious mesh-size refusal;
 *    MAX_SAFE_INTEGER prepares exact directed keys while its next count,
 *    negative, fractional and nonfinite counts refuse preparation.
 */
export const test_validation_mesh_edge_key = (): void => {
  const key = createMeshEdgeKey(7);
  const keys = new Set<number | string>();
  for (let low = 0; low < 7; ++low)
    for (let high = 0; high < 7; ++high) {
      const expected = Number(BigInt(low) * 7n + BigInt(high));
      TestValidator.equals("exact integer pair", key(low, high), expected);
      TestValidator.equals(
        "deterministic query",
        key(low, high),
        key(low, high),
      );
      keys.add(key(low, high));
    }
  TestValidator.equals("all ordered pairs are distinct", keys.size, 7 * 7);
  const limit = Math.floor(Math.sqrt(Number.MAX_SAFE_INTEGER));
  const lastNumeric = createMeshEdgeKey(limit)(limit - 2, limit - 1);
  TestValidator.equals(
    "numeric boundary remains exact",
    lastNumeric,
    Number(BigInt(limit - 2) * BigInt(limit) + BigInt(limit - 1)),
  );
  // At 2^27 identities the pair key is near 2^54: adjacent integer keys
  // need more precision than a double carries there. BigInt supplies an
  // independent oracle and conversion exhibits that actual loss of identity.
  const population = 2 ** 27;
  const low = population - 5;
  const firstHigh = population - 4;
  const secondHigh = firstHigh + 1;
  const exactFirst = BigInt(low) * BigInt(population) + BigInt(firstHigh);
  const exactSecond = BigInt(low) * BigInt(population) + BigInt(secondHigh);
  TestValidator.predicate(
    "the counterexample really loses one integer in double precision",
    exactFirst !== exactSecond && Number(exactFirst) === Number(exactSecond),
  );
  const exactKeys = createMeshEdgeKey(population);
  TestValidator.predicate(
    "the consumed key keeps the counterexample distinct",
    exactKeys(low, firstHigh) !== exactKeys(low, secondHigh),
  );
  const large = limit + 1;
  const fallback = createMeshEdgeKey(large);
  TestValidator.equals(
    "adjacent large pairs retain their identities",
    [fallback(large - 3, large - 2), fallback(large - 3, large - 1)],
    [`${large - 3}/${large - 2}`, `${large - 3}/${large - 1}`],
  );
  TestValidator.predicate(
    "fallback keeps adjacent endpoints distinct",
    fallback(large - 3, large - 2) !== fallback(large - 3, large - 1),
  );
  TestValidator.predicate(
    "fallback retains directed endpoint order",
    fallback(large - 3, large - 1) !== fallback(large - 1, large - 3),
  );
  createMeshEdgeKey(0);
  TestValidator.equals(
    "one identity prepares exactly",
    createMeshEdgeKey(1)(0, 0),
    0,
  );
  const maximum = Number.MAX_SAFE_INTEGER;
  const maximumKey = createMeshEdgeKey(maximum);
  TestValidator.equals(
    "the adjacent valid maximum count retains exact directed endpoints",
    [maximumKey(0, maximum - 1), maximumKey(maximum - 1, 0)],
    [`0/${maximum - 1}`, `${maximum - 1}/0`],
  );
  for (const count of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
    TestValidator.predicate(
      "invalid population refused",
      throwsError(
        () => createMeshEdgeKey(count),
        "nonnegative safe vertex count",
      ),
    );
};
