import type { IAutoMovieRecoveryContourResumePolicy } from "./IAutoMovieRecoveryContourResumePolicy";
import type { IAutoMovieRecoverySlabsInput } from "./IAutoMovieRecoverySlabsInput";

/** Resume explicitly failed source contours without loading saved coefficients.
 * All saved raw populations are rebound before fitting. The caller verifies
 * original bytes, registration, source selection, original triangle ordering
 * and actual artifact policy. Successful, unresolved-tolerance, open and
 * degenerate publications are not failed targets and cannot be refitted here.
 *
 * @evidence contracts/development/design.md#principled-representation The same registered source, physical frame, alias policy and full contour-address ledger identify failed raw observations independently of saved curve representation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Source admission reuses the slab-only input contract; explicit targets and artifact-bound actual policies add precisely the missing selective fitting capability.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Saved coefficient payloads are absent. No normal curve refit, rational reduction, specimen control table, relaxed policy, largest-component selection or source mesh fallback is admitted.
 * @evidence contracts/development/common.md#meaningful-documentation States caller commitments, complete contour coverage, original raw ordinal meaning and the distinction between failed fits and published curves with unresolved tolerance.
 */
export interface IAutoMovieRecoveryContourResumeInput extends Omit<
  IAutoMovieRecoverySlabsInput,
  "slabPairs"
> {
  /** One caller-attested original policy for each distinct targeted artifact identity; duplicate and unused policies refuse. */
  fitPolicies: readonly IAutoMovieRecoveryContourResumePolicy[];

  /** Nonempty distinct failed raw addresses, in requested patch order. Coordinates use signed millimetres along the normalized frame n; contourIndex is the original raw cutter ordinal, never a saved loop/report or new patch index. */
  targets: readonly { coordinateMm: number; contourIndex: number }[];
}
