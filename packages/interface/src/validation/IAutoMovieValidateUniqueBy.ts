/**
 * Identity/path projection for duplicate-id admission at artifact boundaries.
 */
export namespace IAutoMovieValidateUniqueBy {
  /**
   * Borrowed rows scanned in order by validateUniqueBy. Later occurrences of an exactly equal string id append type violations at their own paths; case and whitespace are preserved. Nonstrings are skipped and must be refused by the owning id gate. Empty strings still participate in duplicate detection.
   *
   * The declared mutable array is only read by the validator. Its separate caller-owned violation array is appended without clearing; rows are not retained, and each finding carries the duplicate string value.
   */
  export type IEntries = {
    /** Raw extracted id; only strings enter the seen set, including empty strings. */
    id: unknown;

    /** Exact finding location for this occurrence when an earlier string id matches. */
    path: string;
  }[];
}
