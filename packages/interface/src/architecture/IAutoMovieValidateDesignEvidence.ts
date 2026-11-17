import type { IAutoMovieDesignEvidence } from "./IAutoMovieDesignEvidence";
import type { IAutoMovieDesignReference } from "./IAutoMovieDesignReference";

/**
 * Data and callback contracts shared by the ValidateDesignEvidence operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Validate authored citations from a normalized design to its evidence. Member documentation states the supplied records, units and absence meanings used by validateDesignEvidence.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Citations may contradict observations, but may not dangle; duplicate reference-id rejection belongs to production admission rather than this candidate-index fold.
 * @evidence contracts/development/design.md#principled-representation references and evidence keep observed documents separate from authored citations; exact document/candidate identities and nonblank citation rationale are checked by validateDesignEvidence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateDesignEvidence, used by validateDesignEvidence. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieValidateDesignEvidence {
  /**
   * Validate authored citations from a normalized design to its evidence.
   *
   * A citation may point at an unsettled reading on purpose: recording that a
   * wall was drawn where two centreline candidates disagree is exactly the
   * accountability this graph exists for. What it may not do is point at nothing.
   * A dangling document, a dangling candidate, or a blank rationale each turn the
   * citation into a decoration that survives the evidence it claims to rest on.
   *
   * A citation also needs a non-blank subject and at least one candidate, and may cite each (subject, document, candidate) once. A citation whose document does not resolve skips candidate checks, while subject/rationale blank checks still report findings. Findings use `$input.evidence[i]` paths and nothing throws. Two references sharing an id are merged into one candidate set here rather than refused; the production builder reports that collision as `design-reference-duplicate`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Validate authored citations from a normalized design to its evidence. Member documentation states the supplied records, units and absence meanings used by validateDesignEvidence.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Citations may contradict observations, but may not dangle; duplicate reference-id rejection belongs to production admission rather than this candidate-index fold.
   * @evidence contracts/development/design.md#principled-representation references and evidence keep observed documents separate from authored citations; exact document/candidate identities and nonblank citation rationale are checked by validateDesignEvidence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateDesignEvidence.IProps, used by validateDesignEvidence. Its references, evidence members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Observed documents the citations may point at, keyed by their `id`. */
    references: readonly IAutoMovieDesignReference[];

    /** Authored citations from building subjects to observed candidates. */
    evidence: readonly IAutoMovieDesignEvidence[];
  };
}
