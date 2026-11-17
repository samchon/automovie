import type { IAutoMovieDesignLineage } from "./IAutoMovieDesignLineage";

/**
 * Data and callback contracts shared by the ValidateDesignLineageBinding operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Check a lineage against the identities its host graphs actually publish. Member documentation states the supplied records, units and absence meanings used by validateDesignLineageBinding.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The host identity inventory is required data rather than a dependency on one graph type; undeclared lineage coverage is permitted while dangling declared subjects are refused.
 * @evidence contracts/development/design.md#principled-representation lineage declares the subjects and derived artifacts while known supplies the host's exact published ids; duplicates in known do not change binding membership.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateDesignLineageBinding, used by validateDesignLineageBinding. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieValidateDesignLineageBinding {
  /**
   * Check a lineage against the identities its host graphs actually publish.
   *
   * Self-consistency is not enough: a lineage annotates ids it does not own, so a
   * renamed wall leaves a phase plan quietly talking about nothing. The caller
   * hands over every stable id its graphs publish, which is why this stays a
   * separate function; binding lineage to one named graph would make it useless
   * to the next fold that lands.
   *
   * A host id absent from the lineage is not an error. Lineage is additive, and a
   * production may phase one wing and leave the rest unannotated. The refusals
   * run the other way: a declared subject that resolves to nothing, and a derived
   * artifact id that squats on a design identity.
   *
   * Ids are compared exactly. Findings are returned with `$input.subjects[i].id`
   * or `$input.derived[i].id` paths and nothing throws; the lineage's own
   * consistency is {@link validateDesignLineage}'s to check.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Check a lineage against the identities its host graphs actually publish. Member documentation states the supplied records, units and absence meanings used by validateDesignLineageBinding.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The host identity inventory is required data rather than a dependency on one graph type; undeclared lineage coverage is permitted while dangling declared subjects are refused.
   * @evidence contracts/development/design.md#principled-representation lineage declares the subjects and derived artifacts while known supplies the host's exact published ids; duplicates in known do not change binding membership.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateDesignLineageBinding.IProps, used by validateDesignLineageBinding. Its lineage, known members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Lineage whose subjects and derived ids are checked. */
    lineage: IAutoMovieDesignLineage;

    /** Every stable id the host graphs publish, in any order, duplicates allowed. */
    known: readonly string[];
  };
}
