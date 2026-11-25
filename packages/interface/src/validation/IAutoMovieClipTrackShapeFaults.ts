import type { IAutoMovieTrack } from "../core/IAutoMovieTrack";

/** Track projection shared by clip artifact admission and sampling. */
export namespace IAutoMovieClipTrackShapeFaults {
  /**
   * Borrowed fields inspected by clipTrackShapeFaults. Indexed walks report
   * nonfinite values, invalid times, nonincreasing clocks and malformed
   * strides.
   *
   * The helper returns a fresh ordered fault array without modifying tracks;
   * empty-array faults retain the original array. sampleClip throws its first
   * fault while artifact validation appends all faults. Positive finite
   * duration bounds key times; a zero or invalid duration does not impose that
   * upper bound here.
   */
  export type ITrack = Pick<
    IAutoMovieTrack,
    "times" | "values" | "interpolation" | "channel"
  >;
}
