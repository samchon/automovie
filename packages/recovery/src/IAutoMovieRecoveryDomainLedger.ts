/**
 * Source-free ownership and observed lifecycle of declared reconstruction domains.
 * Null means the legacy operator did not publish that stage's observation; it must
 * not be interpreted as success or failure. Emitted ranges address triangles in
 * the named output model part. Delegated groups retain their own identities while
 * their analytic owner carries ranges that cannot be attributed per group.
 *
 * @evidence contracts/common.md#principled-implementation Exact saved ordinals and actual output ownership distinguish planned members from observed processing rather than inferring membership from equal counts.
 * @evidence contracts/common.md#clear-and-simple-design One ledger describes domain identity and stage observations independently of geometry and shading quality.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing observations remain null and delegated ranges are not guessed from position, proximity or patch names.
 * @evidence contracts/common.md#meaningful-documentation States stable local IDs, part-relative triangle ranges, delegation, unknown stages and memory-only lifecycle scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased record performs no traversal; its producer documents assembly cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type owns no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns ledger arrays and strings; geometry is referenced by identity rather than retained again.
 * @author Samchon
 */
export interface IAutoMovieRecoveryDomainLedger {
  /** Version of this membership record, independent of the curve schema. */
  schema: "automovie-recovery-domain-ledger-v1";

  /** Unbound reports or malformed inventories; original operator reports remain in the result. */
  diagnostics: string[];

  /** Actual contour ranges whose exact declared owner could not be identified. */
  unattributed: {
    part: string;
    firstTriangle: number;
    triangleCount: number;
    beforeMm: number;
    afterMm: number;
    group: number;
  }[];

  /** Every declared group, analytic owner and otherwise unconsumed open course. */
  members: {
    /** Deterministic kind and original saved ordinal; never a source-mesh address. */
    id: string;

    /** The representation owner of this planned occurrence. */
    kind:
      | "closed-group"
      | "tensor-family"
      | "analytic-domain"
      | "open-course"
      | "unassigned-boundary";

    /** Original interval/group address, when this is a closed occurrence. */
    address: { interval: number; group: number } | null;

    /** Saved coefficient identities involved in this occurrence. */
    curves: string[];

    /** Numeric generation was observed, skipped by declared policy, or unknown. */
    attempted: boolean | null;

    /** Actual owner admission, explicit rejection, or unpublished admission state. */
    admitted: boolean | null;

    /** Separate owner carrying actual output ranges for a delegated group. */
    delegatedTo: string | null;

    /** Actual published ranges only; empty does not fabricate a zero-face success. */
    emitted: {
      part: string;
      firstTriangle: number;
      triangleCount: number;
      patch: string | null;
    }[];

    /** Memory reconstruction writes no artifact; a host receipt owns that stage. */
    written: "not-performed";

    /** Memory reconstruction loads no display resource; a viewer receipt owns that stage. */
    loaded: "not-performed";

    /** Local reasons, retaining ambiguity rather than assigning another member's failure. */
    diagnostics: string[];
  }[];
}
