import {
  IAutoMovieExpression,
  IAutoMovieValidation,
} from "@automovie/interface";

import { validateExpression } from "./validateExpression";

/**
 * Convert validateExpression's collected violations into the canonical
 * validation result.
 */
export const validateExpressionResult: (
  expression: IAutoMovieExpression,
) => IAutoMovieValidation = (
  expression: IAutoMovieExpression,
): IAutoMovieValidation => validateExpression({ expression }).toValidation();
