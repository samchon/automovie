import { TestValidator } from "@nestia/e2e";

import { summarizeSample } from "../../../scripts/face-review/summarizeSample";
import { throwsError } from "../internal/predicates";

/**
 * The sample summary reports mean and unbiased standard deviation.
 *
 * Scenarios:
 * 1. The textbook sample 2, 4, 4, 4, 5, 5, 7, 9 has mean 5 and squared
 *    deviations summing to 32, so the sample deviation is sqrt(32 / 7) =
 *    2.138; it rounds to 2.1 at one decimal and 2.14 at two.
 * 2. Two subjects are the smallest sample with a spread: 1 and 3 give a mean
 *    of 2 and a deviation of sqrt(2) = 1.4.
 * 3. One subject and none refuse instead of reporting a zero spread.
 */
export const test_subject_face_sample_summary = (): void => {
  const sample = [2, 4, 4, 4, 5, 5, 7, 9];
  TestValidator.equals("one decimal", summarizeSample(sample, 1), {
    subjects: 8,
    mean: 5,
    sd: 2.1,
  });
  TestValidator.equals("two decimals", summarizeSample(sample, 2).sd, 2.14);
  TestValidator.equals("pair", summarizeSample([1, 3], 1), {
    subjects: 2,
    mean: 2,
    sd: 1.4,
  });
  TestValidator.predicate(
    "too small",
    throwsError(() => summarizeSample([1], 1), "two subjects") &&
      throwsError(() => summarizeSample([], 1), "two subjects"),
  );
};
