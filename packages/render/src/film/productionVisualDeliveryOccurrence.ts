import type { IAutoMovieFilmTimeline } from "@automovie/interface";

/**
 * Spell the identity of one timeline segment occurrence as
 * `occurrence:<index>:<startFrame>-<endFrame>:<shot>`.
 *
 * `index` is the segment's zero-based position in `timeline.segments`, and the
 * frames are its film-timeline start and exclusive end. Visual delivery lanes
 * and the mixed-delivery conform key a source clip by this string, so a clip
 * prepared for one edit no longer joins after a segment moves, changes length
 * or changes shot, and two occurrences of one shot stay distinct.
 *
 * @evidence contracts/common.md#principled-implementation Position, frame span and shot together identify an occurrence uniquely within one timeline, because segment positions are distinct, and spelling them into one string makes equality of occurrences string equality.
 * @evidence contracts/common.md#clear-and-simple-design One template literal is the whole rule, kept in one function so the delivery validator, the conform and its tests derive the same key.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shot or segment is special-cased; the `occurrence:` prefix is the key's fixed namespace, not a compensation.
 * @evidence contracts/common.md#meaningful-documentation The doc gives the exact key grammar, the meaning and unit of each part, which consumers join on it, and which edits change it.
 * @evidence contracts/performance.md#efficient-algorithms The call does constant work beyond copying the shot id into one new string.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call formats one short key from one segment, so caching would cost more than formatting.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The occurrence key is a new string the delivery join compares and discards; the segment argument is read, not referenced afterward, and no handle or task is opened.
 */
export const productionVisualDeliveryOccurrence: (segment: IAutoMovieFilmTimeline["segments"][number], index: number) => string = (
  segment: IAutoMovieFilmTimeline["segments"][number],
  index: number,
): string =>
  `occurrence:${index}:${segment.startFrame}-${segment.endFrame}:${segment.shot}`;
