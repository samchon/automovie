import type { IAutoMovieMotionHumanSegment } from "@automovie/interface";

/** Select a placed carrier for an exact film second in placement order. */
export namespace HumanSegmentSelection {
  /** What a selection reads of an action: when it becomes active. */
  export type IEntered = Pick<IAutoMovieMotionHumanSegment, "entryTime">;

  /**
   * The last placed segment entered by a second, with the existing endpoint
   * allowance. State construction and placement own the dense segment list.
   *
   * @param segments The unchanged placement-order array, initialized empty and
   *   populated by placement pushes.
   * @param seconds Film seconds.
   * @returns The last matching segment reference, or none before any entry.
   */
  export function last<Segment extends IEntered>(
    segments: readonly Segment[],
    seconds: number,
  ): Segment | undefined {
    const limit: number = seconds + 1e-12;
    for (let index: number = segments.length - 1; index >= 0; --index) {
      const segment: Segment = segments[index]!;
      if (segment.entryTime <= limit) return segment;
    }
    return undefined;
  }
}
