import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Report a nonfinite or nonpositive scalar without changing it.
 *
 * @evidence contracts/common.md#principled-implementation Number.isFinite and a strict greater-than-zero boundary report one range finding for nonfinite, zero or negative scalars. Duration, mass, spacing and radius callers supply schema-admitted numbers and retain their units and further domain constraints.
 * @evidence contracts/common.md#clear-and-simple-design One positivity-only gate serves fields without a shared upper limit while the common sink owns diagnostic construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No physical tolerance, minimum substitute or sign correction changes an authored value; positive subnormal numbers remain accepted by this rule.
 * @evidence contracts/common.md#meaningful-documentation Documents strict finite positivity and field attribution; the helper appends findings to its borrowed array without changing a scalar or returning a verdict.
 * @evidence contracts/performance.md#efficient-algorithms Fixed numeric checks and optional field-message construction take constant scalar work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The current scalar is checked directly, with no cached or pending operation to coordinate.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most one finding and field correction string enter the caller-owned array; no scalar history, descriptor or task is retained here.
 */
export const validateProductionDesignPositive: (diagnostics: IAutoMovieDiagnostic[], value: number, target: string, file: string, field: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  value: number,
  target: string,
  file: string,
  field: string,
): void => {
  if (Number.isFinite(value) === false || value <= 0)
    validateProductionDesignInvalid(
      diagnostics,
      "design-range-invalid",
      target,
      file,
      `${field} must be a finite value above zero. Fix ${field} in its design setter.`,
    );
};
