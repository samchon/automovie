import {
  IAutoMovieExpression,
  IAutoMovieValidation,
} from "@automovie/interface";

import { validateExpression } from "./validateExpression";

/*
 * Convert validateExpression's collected violations into the canonical
 * validation result.
 */
export function validateExpressionResult(
  expression: IAutoMovieExpression,
): IAutoMovieValidation {
  return validateExpression({ expression }).toValidation();
}
