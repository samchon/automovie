import type { IAutoMovieConstraintViolation, IAutoMovieValidation } from "@automovie/interface";

/**
 * Re-root space findings beneath the scene's space field, preserving outcome.
 *
 * Warnings and refusals receive the same path mapping. Only an exact input root or its member/index descendants are rewritten; foreign paths remain intact. Success with an undefined warnings field retains its original object, while even an explicitly empty warnings array receives a new wrapper and array. Inputs are never mutated.
 *
 * @evidence contracts/common.md#principled-implementation A rooted path substitution inserts space only at the input root boundary, while the validation discriminant keeps success warnings separate from failure violations without changing severity.
 * @evidence contracts/common.md#clear-and-simple-design One path adapter lets the scene reuse the engine's space gate without asking that owner to know its containing artifact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Embedded and similarly prefixed foreign tokens are not rewritten, and successful advice is retained instead of erased.
 * @evidence contracts/common.md#meaningful-documentation States root-boundary mapping, both severity branches, identity only when success warnings are undefined and unchanged input ownership.
 * @evidence contracts/performance.md#efficient-algorithms For F findings and total path length L the mapping takes O(F+L) time and output space, creating one shallow finding per path without cloning values.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A result is readdressed once for its containing scene and no cross-scene mapping cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned validation owns new finding records while original offending values remain shared; no state or resource survives privately.
 */
export function remapSpaceViolations(validation: IAutoMovieValidation): IAutoMovieValidation {
  if (validation.success && validation.warnings === undefined) return validation;
  const findings: readonly IAutoMovieConstraintViolation[] = validation.success
    ? validation.warnings ?? []
    : validation.violations;
  const mapped: IAutoMovieConstraintViolation[] = findings.map(
    (item: IAutoMovieConstraintViolation): IAutoMovieConstraintViolation => ({
      ...item,
      path: item.path.replace(/^\$input(?=\.|\[|$)/u, "$input.space"),
    }),
  );
  return validation.success
    ? { ...validation, warnings: mapped }
    : { ...validation, violations: mapped };
}
