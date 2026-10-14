/**
 * A next revision, invalid current value, or exhausted safe-integer range.
 *
 * @evidence contracts/common.md#principled-implementation Separate branches distinguish an exact successor, an inadmissible clock and Number.MAX_SAFE_INTEGER, whose successor cannot identify the next exact generation.
 * @evidence contracts/common.md#clear-and-simple-design Only the next branch carries a publishable revision; exhaustion remains distinct from malformed persistence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exhaustion never wraps, saturates or resets the project clock.
 * @evidence contracts/common.md#meaningful-documentation Describes the successor's publication ownership and both refusal causes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The union describes a constant-size result and executes no operation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One decision answers one revision and coordinates no cached mutation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The scalar result acquires no resource or project reference.
 * @author Samchon
 */
export type AutoMovieProjectRevisionAdvance =
  | {
      /** The current revision has one exactly representable successor. */
      state: "next";

      /** The successor to publish after the guarded mutation succeeds. */
      revision: number;
    }
  | {
      /** The current value is outside the revision domain. */
      state: "invalid";
    }
  | {
      /** The current value is valid but has no safe-integer successor. */
      state: "exhausted";
    };
