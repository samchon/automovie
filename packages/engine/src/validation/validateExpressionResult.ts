import {
  IAutoMovieExpression,
  IAutoMovieValidation,
} from "@automovie/interface";

import { validateExpression } from "./validateExpression";

/** Convenience wrapper returning a finished {@link IAutoMovieValidation}. */
export const validateExpressionResult = (
  expression: IAutoMovieExpression,
): IAutoMovieValidation => validateExpression({ expression }).toValidation();
