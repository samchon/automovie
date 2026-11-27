import type { IAutoMovieFilmTimeline } from "@automovie/interface";

/*
 * Spell the identity of one timeline segment occurrence as
 * `occurrence:<index>:<startFrame>-<endFrame>:<shot>`.
 *
 * `index` is the segment's zero-based position in `timeline.segments`, and the
 * frames are its film-timeline start and exclusive end. Visual delivery lanes
 * and the mixed-delivery conform key a source clip by this string, so a clip
 * prepared for one edit no longer joins after a segment moves, changes length
 * or changes shot, and two occurrences of one shot stay distinct.
 */
export const productionVisualDeliveryOccurrence: (
  segment: IAutoMovieFilmTimeline["segments"][number],
  index: number,
) => string = (
  segment: IAutoMovieFilmTimeline["segments"][number],
  index: number,
): string =>
  `occurrence:${index}:${segment.startFrame}-${segment.endFrame}:${segment.shot}`;
