import type { IAutoMovieDesignLineage } from "./IAutoMovieDesignLineage";

/** Data and callback contracts shared by the ValidateDesignLineage operations. */
export namespace IAutoMovieValidateDesignLineage {
  /**
   * Validate one lineage record as a self-consistent phase, alternative, and
   * derivation graph.
   *
   * The record annotates identities other graphs own, so this validator checks
   * the annotation and never the building. What it refuses is exactly the set
   * of ways a lineage stops being able to answer its own questions: a
   * construction plan that requires itself, an alternative applying to a
   * revision nobody recorded, two edits of the same aspect inside one
   * alternative, a subject removed before it was ever installed, and a derived
   * artifact still stamping a superseded revision, reading imported bytes that
   * have since been replaced, or disagreeing with the inputs it was computed
   * from.
   *
   * Staleness is a refusal rather than a warning, which makes the order of a
   * rebake explicit: ask {@link designLineageImpact} what a change reaches while
   * the record still describes the outputs on disk, then move the revision or
   * the imported digest and the outputs together. A record caught mid-rebake is
   * invalid on purpose; the alternative is serving an output nobody can check.
   *
   * Lifecycle coverage is total by the same reasoning
   * {@link IAutoMovieDesignLifecycle} states: a subject with no lifecycle would
   * have to be given a default, and every available default asserts something
   * the author did not, either that the thing predates the work or that it
   * survives it.
   *
   * Comparison fairness is a validation rule rather than a convention. When two
   * alternatives of one decision both carry a derived artifact of the same
   * kind, those artifacts must share a lowering configuration and a phase,
   * because a comparison shot under two cameras compares the cameras. The
   * derived artifact rules are listed on {@link validateDesignLineageDerived}.
   *
   * Every digest must be a lowercase `sha256:` hex digest. Findings are
   * returned with `$input` paths and nothing throws; the lineage query
   * functions throw on the first finding instead. Host identities are not
   * checked here; {@link validateDesignLineageBinding} does that.
   */
  export type IProps = {
    /** Lineage record to validate. */
    lineage: IAutoMovieDesignLineage;
  };
}
