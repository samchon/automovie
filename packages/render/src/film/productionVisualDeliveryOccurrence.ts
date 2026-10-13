import type { IAutoMovieFilmTimeline } from "@automovie/interface";

/** Stable identity of one current timeline occurrence. */
export const productionVisualDeliveryOccurrence = (
  segment: IAutoMovieFilmTimeline["segments"][number],
  index: number,
): string =>
  `occurrence:${index}:${segment.startFrame}-${segment.endFrame}:${segment.shot}`;
