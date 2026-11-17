/**
 * Identity/path projection for duplicate-id admission at artifact boundaries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identity/path projection for duplicate-id admission at artifact boundaries. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation Raw ids preserve ingress values while reporting paths locate later exact-string duplicates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Artifact validators project ids/paths for the shared ordered duplicate detector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Skipping nonstrings delegates their shape admission rather than treating them as valid identities.
 */
export namespace IAutoMovieValidateUniqueBy {
  /**
   * Borrowed rows scanned in order by validateUniqueBy. Later occurrences of an exactly equal string id append type violations at their own paths; case and whitespace are preserved. Nonstrings are skipped and must be refused by the owning id gate. Empty strings still participate in duplicate detection.
   *
   * The declared mutable array is only read by the validator. Its separate caller-owned violation array is appended without clearing; rows are not retained, and each finding carries the duplicate string value.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines exact identity, ordering, skipped nonstrings, ownership and diagnostic effects.
   * @evidence contracts/development/design.md#principled-representation unknown ids preserve raw ingress values until element-level admission, while paths locate later duplicates independently of their identity.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Artifact validators extract their existing ids/paths and reuse one ordered seen-set operation without transferring whole records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This gate does not certify string shape, nonblankness or reference validity and does not trim, choose a winner or remove duplicates.
   */
  export type IEntries = {
    /** Raw extracted id; only strings enter the seen set, including empty strings. */
    id: unknown;

    /** Exact finding location for this occurrence when an earlier string id matches. */
    path: string;
  }[];
}
