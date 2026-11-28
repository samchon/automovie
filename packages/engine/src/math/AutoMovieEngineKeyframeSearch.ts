/** Find adjoining segments on ordered sample clocks. */
export namespace AutoMovieEngineKeyframeSearch {
  /** Choose which segment owns an exact interior key. */
  export type Tie = "previous" | "next";

  /**
   * Find the lower index of the segment around a time on an ordered clock.
   *
   * Provide at least two strictly increasing finite keys and a finite sample
   * time. Out-of-range times select the nearest end segment. An exact interior
   * key uses the preceding or following segment according to exactKey.
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
