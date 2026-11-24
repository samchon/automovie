/** Identity/path projection for duplicate-id admission at artifact boundaries. */
export namespace IAutoMovieValidateUniqueBy {
  /**
   * Borrowed rows scanned in order by validateUniqueBy. Later occurrences of an
   * exactly equal id append type violations at their own paths; case and
   * whitespace are preserved. Empty strings participate in duplicate
   * detection.
   *
   * The declared mutable array is only read by the validator. Its separate
   * caller-owned violation array is appended without clearing; rows are not
   * retained, and each finding carries the duplicate string value.
   */
  export type IEntries = {
    /** Extracted id. */
    id: string;

    /**
     * Exact finding location for this occurrence when an earlier id matches.
     */
    path: string;
  }[];
}
