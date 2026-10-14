import {
  IAutoMovieDesignLineage,
  IAutoMovieDesignVariant,
} from "@automovie/interface";

/**
 * The design variant one id names, or a thrown `Error` naming both the
 * lineage and the missing id.
 *
 * The first variant declared under the id is returned; duplicate ids are a
 * contradiction `validateDesignLineage` refuses, not one this lookup
 * re-decides.
 *
 * @param lineage Lineage holding the variant.
 * @param variant Id of the variant to resolve.
 * @returns The lineage's own variant record, not a copy.
 *
 * @evidence contracts/common.md#principled-implementation A first-match linear lookup over `lineage.variants`, so on a validated lineage, where ids are unique, the answer is the one variant with that id.
 * @evidence contracts/common.md#clear-and-simple-design One lookup and refusal shared by the comparison and view-digest queries, which each kept a private copy of the same message.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no lineage or variant; an unknown id always throws rather than being treated as the head revision.
 * @evidence contracts/common.md#meaningful-documentation States that the result is the record itself, what the thrown message names, and the first-match reading of a duplicate id that validation refuses.
 * @evidence contracts/performance.md#efficient-algorithms Time is linear in the variant count with constant space; one or two lookups per query do not justify an index.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A single synchronous lookup that coordinates nothing across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned variant is the caller's own record object.
 */
export const requireDesignVariant: (lineage: IAutoMovieDesignLineage, variant: string) => IAutoMovieDesignVariant = (
  lineage: IAutoMovieDesignLineage,
  variant: string,
): IAutoMovieDesignVariant => {
  const found: IAutoMovieDesignVariant | undefined = lineage.variants.find(
    (entry: IAutoMovieDesignVariant): boolean => entry.id === variant,
  );
  if (found === undefined)
    throw new Error(
      `design lineage "${lineage.id}" has no design variant "${variant}"`,
    );
  return found;
};
