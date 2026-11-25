import { reconstructAutoMovieRecoveryModel } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { recoveryPrismOracle as prism } from "../../internal/recoveryPrismOracle";

/**
 * Saved square rings generate new metre geometry without any source mesh input.
 * The analytic side area is perimeter 12 mm times height 2 mm, or 24e-6 m².
 *
 * Scenarios:
 *
 * 1. Two straight cubic square rings generate the uncapped prism side surface.
 * 2. Every boundary edge belongs to one of the two known square ends.
 * 3. A disjoint unsupported domain retains the valid surface and reports partial.
 * 4. Explicit prefix coverage remains partial even with successful retained
 *    geometry.
 */
export function test_recovery_reconstruction_reconstruct_model(): void {
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
    if (
      input === partialInput &&
      (result.status === "complete" || result.status === "partial")
    )
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
