import { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * Format the first five already collected findings as path/expectation pairs joined by semicolons. The complete sink still controls refusal in the caller; this display projection omits later rows without bounding the included strings' lengths or mutating any finding.
 *
 * @evidence contracts/common.md#principled-implementation The first five findings project path/expected strings into one explanation.
 * @evidence contracts/common.md#clear-and-simple-design Bounds diagnostic row count independently of full validation collection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Additional findings still caused refusal even though this explanation omits them; string lengths remain unbounded.
 * @evidence contracts/common.md#meaningful-documentation States five-row projection and truncation meaning.
 * @evidence contracts/performance.md#efficient-algorithms Copies/formats at most five records plus their text lengths.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses already acquired findings without revalidation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only explanation text escapes; no handle is acquired.
 */
export const autoMovieProjectDescribeViolations: (violations: readonly IAutoMovieConstraintViolation[]) => string = (violations: readonly IAutoMovieConstraintViolation[]): string => violations
    .slice(0, 5)
    .map((violation: IAutoMovieConstraintViolation): string => `${violation.path}: ${violation.expected}`)
    .join("; ");
