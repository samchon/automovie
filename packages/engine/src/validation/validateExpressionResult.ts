import { IAutoMovieExpression, IAutoMovieValidation } from "@automovie/interface";
import { validateExpression } from "./validateExpression";

/**
 * Convenience wrapper returning a finished {@link IAutoMovieValidation}.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `validateExpressionResult` returns the expression validator's located findings under the default expression root.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `validateExpressionResult` converts the collected channel paths into the canonical success-or-error envelope without readdressing them.
 */
export const validateExpressionResult = (
  expression: IAutoMovieExpression,
): IAutoMovieValidation => validateExpression({ expression }).toValidation();
