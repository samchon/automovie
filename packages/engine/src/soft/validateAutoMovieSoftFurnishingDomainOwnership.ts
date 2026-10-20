import {
  IAutoMovieSoftFurnishing,
  IAutoMovieValidation,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { ViolationCollector } from "../validation/ViolationCollector";

/** Refuse duplicate typed furnishing bindings to the same world-space cloth domain, independently of building grouping. Domain and furnishing ids use code-unit order; source indices still identify the original conflicting rows.
 *
 * @evidence contracts/common.md#principled-implementation Domain grouping followed by sorted furnishing ids chooses one deterministic owner, with source index only breaking duplicate-id ties. Separate validators admit string ids and reference existence.
 * @evidence contracts/common.md#clear-and-simple-design Production environment validation and furnishing validation share one ownership gate and the canonical text comparator, preserving the same world-space ownership and code-unit order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cross-environment duplication is not permitted by a grouping exception; identical ids retain their explicit source-index tie rather than a fabricated owner.
 * @evidence contracts/common.md#meaningful-documentation States world-space exclusivity, order policy, index meaning and separate admission premises.
 * @evidence contracts/performance.md#efficient-algorithms For F furnishings across D domains, grouping costs expected O(F); key and per-group sorting cost O(D log D+sum(Fd log Fd)), with O(F+D) working and conflict storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One domain group is sorted once and its first owner is reused across all conflict findings; mutable input lists are not cached between validation attempts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Groups retain source references only locally; the returned ordered validation findings keep id/value scalars, with no domain geometry or host retained.
 */
export const validateAutoMovieSoftFurnishingDomainOwnership: (
  furnishings: readonly IAutoMovieSoftFurnishing[],
) => IAutoMovieValidation = (
  furnishings: readonly IAutoMovieSoftFurnishing[],
): IAutoMovieValidation => {
  const byDomain: Map<
    string,
    { furnishing: IAutoMovieSoftFurnishing; index: number }[]
  > = new Map<
    string,
    { furnishing: IAutoMovieSoftFurnishing; index: number }[]
  >();
  furnishings.forEach(
    (furnishing: IAutoMovieSoftFurnishing, index: number): void => {
      const owners: { furnishing: IAutoMovieSoftFurnishing; index: number }[] =
        byDomain.get(furnishing.domain) ?? [];
      owners.push({ furnishing, index });
      byDomain.set(furnishing.domain, owners);
    },
  );
  const out: ViolationCollector = new ViolationCollector();
  for (const domain of [...byDomain.keys()].sort(compareCodeUnits)) {
    const owners: { furnishing: IAutoMovieSoftFurnishing; index: number }[] =
      byDomain
        .get(domain)!
        .sort(
          (
            left: { furnishing: IAutoMovieSoftFurnishing; index: number },
            right: { furnishing: IAutoMovieSoftFurnishing; index: number },
          ): number => {
            const compared: number = compareCodeUnits(
              left.furnishing.id,
              right.furnishing.id,
            );
            return compared !== 0 ? compared : left.index - right.index;
          },
        );
    const owner: { furnishing: IAutoMovieSoftFurnishing; index: number } =
      owners[0]!;
    for (const duplicate of owners.slice(1))
      out.push(
        "type",
        `$input.furnishings[${duplicate.index}].domain`,
        `soft body domain "${domain}" is already drawn by furnishing "${owner.furnishing.id}"`,
        domain,
      );
  }
  return out.toValidation();
};
