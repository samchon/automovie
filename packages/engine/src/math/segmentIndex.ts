import { AutoMovieEngineKeyframeSearch } from "./AutoMovieEngineKeyframeSearch";

/**
 * Find the lower index of an admitted interior sample. An exact key selects the
 * segment ending at that key. The caller handles the first and last keys.
 *
 * @param length Number of strictly increasing finite key times, at least two.
 * @param timeAt Read a key time by index.
 * @param time The strictly interior sample time on the same clock.
 * @returns The lower index of the straddling segment.
 */
export function segmentIndex(
  length: number,
  timeAt: (index: number) => number,
  time: number,
): number {
  return AutoMovieEngineKeyframeSearch.segment(
    length,
    timeAt,
    time,
    "previous",
  );
}
