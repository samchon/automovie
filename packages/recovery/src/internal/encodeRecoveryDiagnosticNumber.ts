import type { IAutoMovieRecoveryDiagnosticNumber } from "../structures/image/IAutoMovieRecoveryDiagnosticNumber";

/**
 * Encode an already computed number without changing its numerical owner.
 *
 * @evidence contracts/common.md#principled-implementation Finite numbers remain numeric; computed NaN and signed infinities receive explicit fixed JSON-safe sentinels instead of unavailable null.
 * @evidence contracts/common.md#clear-and-simple-design One total scalar conversion serves fixed field projections; unavailable null is handled by each typed nullable member.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No zero fallback, new gate, exception, numerical recomputation or mutation supplies a diagnostic value.
 * @evidence contracts/common.md#meaningful-documentation Defines finite and nonfinite representations and retains original quantity units.
 * @evidence contracts/performance.md#efficient-algorithms Fixed predicates and branches take constant visits and no array allocation; the camera projection owner prepays all calls.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads the existing computed scalar without reevaluating geometry, rows, models or certificates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one finite number or fixed literal with no acquired state or handle.
 */
export function encodeRecoveryDiagnosticNumber(
  value: number,
): IAutoMovieRecoveryDiagnosticNumber {
  if (Number.isFinite(value)) return value;
  if (Number.isNaN(value)) return "NaN";
  return value > 0 ? "+Infinity" : "-Infinity";
}
