import { validateAutoMovieNaturalnessStages } from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Final-pass selection is explicit and cannot conceal a misspelled stage key.
 *
 * Scenarios:
 *
 * 1. Each lifecycle state is valid on the sole screenplay key.
 * 2. Omitted, primitive, null, and array declarations are refused.
 * 3. Missing, additional, or misspelled keys and unsupported states are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateAutoMovieNaturalnessStages for every admitted lifecycle value and requires synchronous Error refusals for malformed maps, catching missing shape or vocabulary admission while allowing the sole screenplays declaration.
 * @evidence contracts/testing.md#independent-expectations The closed declaration contract requires exactly one enumerable screenplays key and disabled, draft, evidence or review; literal absent, primitive, array and wrong-key inputs violate that shape independently of the validator. Refusal type is observed without pinning diagnostic wording.
 * @evidence contracts/testing.md#distinguishing-cases Covers all four valid stages and twelve malformed maps, including empty, missing, extra and misspelled keys and nonstring or unknown stages; inherited, nonenumerable and symbol properties are outside this case set.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_evidence_naturalness_stages entry owns both literal case loops and directly calls the portable validator through throwsError, with no filesystem, installed consumer or real host.
 */
export function test_evidence_naturalness_stages(): void {
  for (const screenplays of ["disabled", "draft", "evidence", "review"])
    validateAutoMovieNaturalnessStages({ screenplays });
  for (const value of [
    undefined,
    null,
    false,
    0,
    "review",
    [],
    {},
    { screenplay: "review" },
    { screenplays: "review", scripts: "review" },
    { screenplays: undefined },
    { screenplays: "final" },
    { screenplays: 1 },
  ])
    TestValidator.predicate(
      "invalid explicit naturalness map",
      throwsError((): void => validateAutoMovieNaturalnessStages(value)),
    );
}
