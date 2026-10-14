

/**
 * Reservation outcome returned by the project transaction. Acquired permits the execution owner to proceed; another active or unknown owner blocks takeover, while changed prefix refuses this proposed claim without staging it. Reader/schema/transaction failures throw outside this union.
 *
 * @evidence contracts/common.md#principled-implementation The discriminated result keeps acquired, changed-prefix, active-owner and unresolved-outcome facts distinct at the atomic claim boundary.
 * @evidence contracts/common.md#clear-and-simple-design Compact outcomes carry an owner attempt only when another reservation/outcome matters; execution owns the resulting dispatch decision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown outcome remains explicit rather than treated as safe retry, and exception paths are not represented as acquired.
 * @evidence contracts/common.md#meaningful-documentation Prose states each outcome's dispatch meaning and distinguishes transaction exceptions from returned refusal states.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This union performs no resident prefix enumeration, digest or transaction work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result vocabulary coordinates no provider requests or completed-attempt reuse by itself.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type owns no lock/task and introduces no retained owner map; the transaction/execution owners control runtime state.
 * @author Samchon
 */
export type AutoMovieRepaintClaimAdmission =
  | {
      /** This claim acquired the request reservation before dispatch. */
      status: "acquired";
    }
  | {
      /** An unsettled resident claim prevents another dispatch. */
      status: "already-active";

      /** Attempt retaining that active reservation. */
      ownerAttemptId: string;
    }
  | {
      /** Current prefix, ordinal or claim-generation identity differs from this proposal. */
      status: "prefix-changed";
    }
  | {
      /** A resident unknown external outcome prevents automatic takeover. */
      status: "unknown-outcome";

      /** Attempt whose external outcome still needs reconciliation. */
      ownerAttemptId: string;
    };
