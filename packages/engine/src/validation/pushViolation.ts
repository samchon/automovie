import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { violation } from "./violation";

/**
 * Append a typed artifact fault with the supplied path, expected meaning and actual value.
 *
 * @evidence contracts/common.md#principled-implementation Append a typed artifact fault with the supplied path, expected meaning and actual value.
 * @evidence contracts/common.md#clear-and-simple-design Artifact validators share violation as the row-construction owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No deduplication, severity rewrite or input repair hides a reported fault.
 * @evidence contracts/common.md#meaningful-documentation The function mutates the supplied list and preserves diagnostic order.
 * @evidence contracts/performance.md#efficient-algorithms One append is amortized constant work plus text/value storage supplied by the caller.
 * @evidence contracts/performance.md#reuse-equivalent-work Every call records a distinct validation effect rather than caching equal rows.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller's list owns rows and any referenced actual values until it releases the report.
 */
export const pushViolation: (
  violations: IAutoMovieConstraintViolation[],
  kind: IAutoMovieConstraintViolation["kind"],
  path: string,
  expected: string,
  value: unknown,
) => void = (
  violations: IAutoMovieConstraintViolation[],
  kind: IAutoMovieConstraintViolation["kind"],
  path: string,
  expected: string,
  value: unknown,
): void => {
  violations.push(violation(kind, path, expected, value));
};
