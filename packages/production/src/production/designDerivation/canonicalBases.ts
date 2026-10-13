import { compareCodeUnits } from "../contentIdentity";
import type { IAutoMovieDesignDerivationBasis } from "./IAutoMovieDesignDerivationBasis";
import { canonicalBasis } from "./canonicalBasis";

/**
 * Sort validated bases and reject repeated target or record-path identities.
 *
 * @evidence contracts/common.md#principled-implementation Applies canonicalBasis to each supplied basis, code-unit sorts target names and uses Sets to enforce one target and one path per basis.
 * @evidence contracts/common.md#clear-and-simple-design Keeps inventory uniqueness distinct from per-basis scalar/path validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uniqueness applies only to the supplied inventory and establishes neither project completeness nor actual source execution.
 * @evidence contracts/common.md#meaningful-documentation Documents canonical target ordering and separate duplicate-target/path refusals.
 * @evidence contracts/performance.md#efficient-algorithms Per-basis validation/sorting costs remain included, plus n-target O(n log n) comparisons and two linear uniqueness passes.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses canonicalBasis implementation, not a cached validity answer or prior inventory snapshot.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns copied basis records in a new array; temporary Sets retire after validation and no IO resource is acquired.
 */
export function canonicalBases(
  bases: readonly IAutoMovieDesignDerivationBasis[],
): readonly IAutoMovieDesignDerivationBasis[] {
  const output: IAutoMovieDesignDerivationBasis[] = bases
    .map((basis: IAutoMovieDesignDerivationBasis): IAutoMovieDesignDerivationBasis => canonicalBasis(basis))
    .sort((left: IAutoMovieDesignDerivationBasis, right: IAutoMovieDesignDerivationBasis): number => compareCodeUnits(left.target, right.target));
  if (new Set(output.map((basis: IAutoMovieDesignDerivationBasis): string => basis.target)).size !== output.length)
    throw new Error("Design producer basis repeats a target identity.");
  if (new Set(output.map((basis: IAutoMovieDesignDerivationBasis): string => basis.recordPath)).size !== output.length)
    throw new Error(
      "Design producer basis maps several targets to one record path.",
    );
  return output;
}
