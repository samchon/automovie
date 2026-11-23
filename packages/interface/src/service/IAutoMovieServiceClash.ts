/** One serviceSegmentClashes pair in network declaration order. */
export interface IAutoMovieServiceClash {
  /** Id of the earlier-declared segment. */
  left: string;
  /** Id of the later-declared segment. */
  right: string;
}
