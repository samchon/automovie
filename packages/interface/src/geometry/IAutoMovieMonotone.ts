/** Writable first-derivative storage for the monotone cubic kernel. */
export namespace IAutoMovieMonotone {
  /** Writable derivative destination with one scalar for each admitted knot. */
  export type ISlopeSlopes = { [index: number]: number };
}
