import { IAutoMovieSubjectMemberSummary } from "@automovie/interface";

import { AutoMovieEngineSubjectMemberSampleLimit } from "../../constants/AutoMovieEngineSubjectMemberSampleLimit";
import { compareRenderIds } from "../../render/internal/compareRenderIds";

/*
 * One page of a subject id list: the total, and at most
 * `AutoMovieEngineSubjectMemberSampleLimit` ids in render-id order starting at
 * `offset`.
 *
 * The offset is clamped to the total, so a page past the end is empty with
 * `offset` equal to `total`; `omitted` counts every id not on the page, before
 * it as well as after. The input is copied, not sorted in place.
 * Parameter ids: Subject addresses in any order.
 * Parameter offset: Rank of the first id on the page, a whole number from 0.
 * Returns: The page summary.
 */
export const subjectMemberSummary = (
  ids: readonly string[],
  offset: number,
): IAutoMovieSubjectMemberSummary => {
  const sorted: string[] = [...ids].sort(compareRenderIds);
  const start: number = Math.min(offset, sorted.length);
  const items: string[] = sorted.slice(
    start,
    start + AutoMovieEngineSubjectMemberSampleLimit,
  );
  return {
    total: sorted.length,
    offset: start,
    items,
    omitted: sorted.length - items.length,
  };
};
