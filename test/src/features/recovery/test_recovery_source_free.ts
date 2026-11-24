import { reconstructAutoMovieRecoveryModel } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { recoveryPrismOracle as prism } from "../internal/recoveryPrismOracle";

/**
 * Saved square rings generate new metre geometry without any source mesh input.
 * The analytic side area is perimeter 12 mm times height 2 mm, or 24e-6 m².
 *
 * Scenarios:
 * 1. Two straight cubic square rings generate the uncapped prism side surface.
 * 2. Every boundary edge belongs to one of the two known square ends.
 * 3. A disjoint unsupported domain retains the valid surface and reports partial.
 * 4. Explicit prefix coverage remains partial even with successful retained geometry.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public source-free reconstruction API and measures generated indexed triangles, finite physical positions, side area, directed edge incidence, exposed end perimeter, retained primitive ownership and input nonmutation. A missing wall, invented cap, dropped independent domain or false complete terminal fails.
 * @evidence contracts/development/testing.md#independent-expectations Authored linear Bernstein controls define two 3-mm squares separated by 2 mm; four rectangular walls give 24e-6 m² and the two open ends give 24e-3 m of boundary. Edge incidence follows an uncapped annulus independently of triangulation choice; this does not prove arbitrary surface embedding or appearance.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts complete declared continuation with a separate unsupported group and an incomplete prefix while preserving the same valid domain. Assertions allow adaptive subdivisions and render-vertex duplication, avoiding exact triangle counts and generated snapshots. Terminal refusal, cancellation and observer failure belong to test_recovery_public_lifecycle.
 * @evidence contracts/development/testing.md#execution-ownership The portable test_recovery_source_free entry owns small saved-coefficient fixtures and CPU measurements only, imports supported public packages and an existing scalar comparison helper, and opens no source, filesystem, process, renderer or native artifact. Central validation owns execution and reports elapsed time without a duration acceptance limit.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Two straight cubic square rings generate the uncapped prism side surface.).
 */
export function test_recovery_source_free(): void {
  type Input = prism.Input;
  const completeInput: Input = prism.makeInput(false);
  const partialInput: Input = prism.makeInput(true);
  const prefixInput: Input = {
    ...prism.makeInput(false),
    coverage: {
      complete: false,
      plannedSections: 3,
      retainedSections: 2,
      sourceRangeMm: [0, 4],
      observedStationRangeMm: [0, 2],
      unobservedStationRangeMm: [2, 4],
      missingSourceRangeMm: [2, 4],
    },
  };
  for (const input of [completeInput, partialInput, prefixInput]) {
    const original: string = JSON.stringify(input);
    const result: ReturnType<typeof reconstructAutoMovieRecoveryModel> =
      reconstructAutoMovieRecoveryModel(input);
    TestValidator.equals(
      "declared coverage determines terminal",
      result.status,
      input === completeInput ? "complete" : "partial",
    );
    prism.measure(result);
    if (input === partialInput && "value" in result)
      TestValidator.predicate(
        "unsupported independent domain remains explicit",
        result.value.unresolved.some(
          (record: (typeof result.value.unresolved)[number]): boolean =>
            nclose(record.beforeMm, 0, 1e-12) &&
            nclose(record.afterMm, 2, 1e-12) &&
            record.reason === "General domain intentionally unsupported",
        ),
      );
    TestValidator.equals(
      "saved coefficient authority is unchanged",
      JSON.stringify(input),
      original,
    );
  }
}