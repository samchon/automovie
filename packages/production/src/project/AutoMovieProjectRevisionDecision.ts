/**
 * A decoded non-negative safe-integer project revision, or an invalid record.
 *
 * @evidence contracts/common.md#principled-implementation The discriminant separates admitted revision data from a present malformed record; the decoder maps only a missing record to legacy revision zero.
 * @evidence contracts/common.md#clear-and-simple-design Only the current branch carries a revision a reader may use.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid persistence is explicit rather than repaired to the missing-record default.
 * @evidence contracts/common.md#meaningful-documentation States the numeric domain and when the decoded revision is available.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This union describes the decoder's constant-size result and executes no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result starts no work or shared revision observation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns scalar data with no document bytes, handle or task.
 * @author Samchon
 */
export type AutoMovieProjectRevisionDecision =
  | {
      /** The persisted value belongs to the project-revision domain. */
      state: "current";

      /** The current non-negative safe integer. */
      revision: number;
    }
  | {
      /** A present record did not contain one valid revision. */
      state: "invalid";
    };
