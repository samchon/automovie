import { IAutoMovieSubjectMemberSummary } from "@automovie/interface";

import { AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT } from "../../constants/AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT";
import { compareAutoMovieRenderIds } from "../../render/internal/compareAutoMovieRenderIds";

/*
 * One page of a subject id list: the total, and at most
 * `AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT` ids in render-id order starting at
 * `offset`.
 *
 * The offset is clamped to the total, so a page past the end is empty with
 * `offset` equal to `total`; `omitted` counts every id not on the page, before
 * it as well as after. The input is copied, not sorted in place.
 * Parameter ids: Subject addresses in any order.
 * Parameter offset: Rank of the first id on the page, a whole number from 0.
 * Returns: The page summary.
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
