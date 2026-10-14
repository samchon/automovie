import { IAutoMovieSubjectMemberSummary } from "@automovie/interface";

import { AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT } from "./constants/AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT";
import { compareAutoMovieRenderIds } from "./render/compareAutoMovieRenderIds";

/**
 * One page of a subject id list: the total, and at most
 * `AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT` ids in render-id order starting at
 * `offset`.
 *
 * The offset is clamped to the total, so a page past the end is empty with
 * `offset` equal to `total`; `omitted` counts every id not on the page, before
 * it as well as after. The input is copied, not sorted in place.
 *
 * @param ids Subject addresses in any order.
 * @param offset Rank of the first id on the page, a whole number from 0.
 * @returns The page summary.
 *
 * @evidence contracts/common.md#principled-implementation Sorting with the shared render-id comparator gives one deterministic order to page through, and clamping makes every offset a valid page without inventing ids.
 * @evidence contracts/common.md#clear-and-simple-design One paging rule for subject member lists and diff consequence lists, which previously kept separate copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No id or list is special-cased; the sample limit is the shared named constant.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the order, the page size, the clamp, what `omitted` counts, and that the input is not mutated.
 * @evidence contracts/performance.md#efficient-algorithms O(n log n) for n ids, dominated by the sort that defines which ids a page holds.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure summary of one list that coordinates no work across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The sorted copy is released on return; the returned page holds at most the sample limit of ids.
 */
export const autoMovieSubjectMemberSummary = (
  ids: readonly string[],
  offset: number,
): IAutoMovieSubjectMemberSummary => {
  const sorted: string[] = [...ids].sort(compareAutoMovieRenderIds);
  const start: number = Math.min(offset, sorted.length);
  const items: string[] = sorted.slice(
    start,
    start + AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT,
  );
  return {
    total: sorted.length,
    offset: start,
    items,
    omitted: sorted.length - items.length,
  };
};
