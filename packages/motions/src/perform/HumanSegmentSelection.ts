import type { IAutoMovieMotionHumanSegment } from "@automovie/interface";

/** Select a placed carrier for an exact film second in placement order. */
export namespace HumanSegmentSelection {
  /**
   * The last placed segment entered by a second, with the existing endpoint
   * allowance. State construction and placement own the dense segment list.
   *
   * @param segments The unchanged placement-order array, initialized empty and
   *   populated by placement pushes.
   * @param seconds Film seconds.
   * @returns The last matching segment reference, or none before any entry.
   */
  export function last(
    segments: readonly IAutoMovieMotionHumanSegment[],
    seconds: number,
  ): IAutoMovieMotionHumanSegment | undefined {
    if (segments.length === 0) return undefined;
    const limit: number = seconds + 1e-12;
    for (let index: number = segments.length - 1; index >= 0; --index) {
      const segment: IAutoMovieMotionHumanSegment = segments[index];
      if (segment.entryTime <= limit) return segment;
    }
    return undefined;
  }
}
