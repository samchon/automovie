import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Report nonfinite scalars at the supplied design field without substitution.
 *
 * @evidence contracts/common.md#principled-implementation Number.isFinite rejects NaN and both infinities with one range finding; schema-admitted numerical fields are supplied by the vector, world, predicate, shot and instance gates. Finite input alone does not ensure finite derived arithmetic, physical range or geometry validity.
 * @evidence contracts/common.md#clear-and-simple-design One finiteness-only rule serves fields whose narrower domain belongs to their enclosing gate, and the shared sink owns diagnostic construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Negative values and zero remain permitted here; no coercion, finite fallback or consumer-specific exception changes the supplied scalar.
 * @evidence contracts/common.md#meaningful-documentation States the nonfinite refusal and caller-supplied field/target/file attribution; this appends to the borrowed array, changes no design value and returns no admission verdict.
 * @evidence contracts/performance.md#efficient-algorithms One finite check and optional field-message construction take constant scalar work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The current scalar is checked directly, with no cached or pending operation to coordinate.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most one finding and field correction string enter the caller-owned array; no scalar history, descriptor or task is retained here.
 */
export const validateProductionDesignFinite: (diagnostics: IAutoMovieDiagnostic[], value: number, target: string, file: string, field: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  value: number,
  target: string,
  file: string,
  field: string,
): void => {
  if (Number.isFinite(value) === false)
    validateProductionDesignInvalid(
      diagnostics,
      "design-range-invalid",
      target,
      file,
      `${field} must be finite. Fix ${field} in its design setter.`,
    );
};
