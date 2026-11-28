/**
 * Selects the complete narrative or one exact first part of a long narrative.
 *
 * The scope filters scripts and screenplays. Treatments use every event
 * currently in that layer because treatments have no part folders.
 */
export type AutoMovieEvidenceNarrativeScope =
  | AutoMovieEvidenceNarrativeScope.ICompleteWork
  | AutoMovieEvidenceNarrativeScope.IFirstPartPilot;

export namespace AutoMovieEvidenceNarrativeScope {
  /** Selects every authored scene or episode on either narrative route. */
  export interface ICompleteWork {
    /** Complete-work scope, the default when no scope is supplied. */
    mode: "complete-work";
  }

  /** Selects one exact script and screenplay part on the long route. */
  export interface IFirstPartPilot {
    /** Exact first-part scope. */
    mode: "first-part-pilot";

    /** First-part folder in the form `001-lower-kebab-case`. */
    part: `001-${string}`;
  }
}
