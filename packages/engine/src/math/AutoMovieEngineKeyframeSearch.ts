/** Find adjoining segments on ordered sample clocks. */
export namespace AutoMovieEngineKeyframeSearch {
  /** Choose which segment owns an exact interior key. */
  export type Tie = "previous" | "next";

  /**
   * Find the lower index of the segment containing a finite sample time. An
   * exact interior key selects the preceding or following segment as requested.
   * Times outside the sequence select the first or last segment.
   *
   * @param length Number of strictly increasing finite keys, at least two.
   * @param timeAt Read a key's position in the same clock as the sample.
   * @param time Position of the sample on that clock.
   * @param exactKey Segment to use at an exact interior key.
   * @returns The lower index of the segment, from zero to length minus two.
   */
  export function segment(
    length: number,
    timeAt: (index: number) => number,
    time: number,
    exactKey: Tie,
  ): number {
    let low: number = 0;
    let high: number = length - 2;
    while (low < high) {
      const middle: number = low + Math.ceil((high - low) / 2);
      const key: number = timeAt(middle);
      if (key < time || (key === time && exactKey === "next")) low = middle;
      else high = middle - 1;
    }
    return low;
  }
}
