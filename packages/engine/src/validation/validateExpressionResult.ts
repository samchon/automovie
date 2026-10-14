import {
  IAutoMovieExpression,
  IAutoMovieValidation,
} from "@automovie/interface";

import { validateExpression } from "./validateExpression";

/**
 * Convert validateExpression's collected violations into the canonical validation result.
 *
 * @evidence contracts/common.md#principled-implementation Convert validateExpression's collected violations into the canonical validation result.
 * @evidence contracts/common.md#clear-and-simple-design The wrapper exposes result shape while the expression owner retains all admission rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expression is repaired and advisory/error policy follows the collector conversion.
 * @evidence contracts/common.md#meaningful-documentation The input is borrowed and success means these range/menu checks passed.
 * @evidence contracts/performance.md#efficient-algorithms Expression traversal and violation partitioning remain the dominant B/V costs despite this thin wrapper.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing expression checker and toValidation are called rather than reimplemented.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the result's diagnostic arrays escape; no expression history or host resource is retained.
 */
export const validateExpressionResult: (
  expression: IAutoMovieExpression,
) => IAutoMovieValidation = (
  expression: IAutoMovieExpression,
): IAutoMovieValidation => validateExpression({ expression }).toValidation();
