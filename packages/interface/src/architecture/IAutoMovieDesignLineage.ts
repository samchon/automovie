import { IAutoMovieDerivedArtifact } from "./IAutoMovieDerivedArtifact";
import { IAutoMovieDesignDecision } from "./IAutoMovieDesignDecision";
import { IAutoMovieDesignLifecycle } from "./IAutoMovieDesignLifecycle";
import { IAutoMovieDesignPhase } from "./IAutoMovieDesignPhase";
import { IAutoMovieDesignRevision } from "./IAutoMovieDesignRevision";
import { IAutoMovieDesignSubject } from "./IAutoMovieDesignSubject";
import { IAutoMovieDesignVariant } from "./IAutoMovieDesignVariant";

/**
 * Phases, alternatives, and derivation for one work, over identities other graphs own.
 *
 * Nothing here is a building. The record annotates ids that already exist elsewhere, which is what keeps a renovation from being modelled as a second building and an alternative from being modelled as a third. A production that declares no lineage at all is unaffected: this fold is additive, and its absence means only that no phase or alternative claim is being made.
 *
 * A shot's lineage is validated for coherence when the shot compiles, and its subjects are bound to the ids the production publishes when the production builds. A stale derived artifact is a refusal, not a warning.
 *
 * @evidence contracts/common.md#principled-implementation Shot runtime checks identity/reference coherence, acyclic revision/phase/derivation graphs, resolving head, total lifecycles and recorded artifact freshness through `validateDesignLineage`. Production review outside design-only scope with compiled shots binds subjects to published ids and rejects derived-id collisions. Both gates use authored metadata and typed nested records; neither applies variants, inspects output bytes or certifies dependency completeness.
 * @evidence contracts/common.md#clear-and-simple-design One record holds the seven lists a lineage answers from, each owned by its own member type, and points at foreign graphs only through subject ids, so no building type gains a phase or variant field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Staleness is refused and no lifecycle is invented; canonically equal lineages may be shared across shots, while different lineages with one id refuse compilation before either can become an accepted binding.
 * @evidence contracts/common.md#meaningful-documentation States foreign identity annotation, absence semantics, coherence and binding gates, artifact head stamps, minimum revisions and canonical-equality sharing with conflicting-id refusal.
 * @author Samchon
 */
export interface IAutoMovieDesignLineage {
  /** Schema version; validation accepts only `1`. */
  version: 1;

  /**
   * Stable, non-blank lineage identity within the production.
   *
   * Canonically equal lineages may be shared across shots. Different lineages under one id refuse compilation rather than replace one another.
   */
  id: string;

  /** Revision the work is on now; every derived artifact must stamp it. */
  head: string;

  /** Every identity this lineage speaks about. */
  subjects: IAutoMovieDesignSubject[];

  /** Every recorded state of the authored source; at least one. */
  revisions: IAutoMovieDesignRevision[];

  /** The construction plan, as an acyclic graph of prerequisites. */
  phases: IAutoMovieDesignPhase[];

  /** Exactly one entry per declared subject. */
  lifecycles: IAutoMovieDesignLifecycle[];

  /** Alternatives preserved side by side over their base revisions. */
  variants: IAutoMovieDesignVariant[];

  /** Open and settled comparisons between those alternatives. */
  decisions: IAutoMovieDesignDecision[];

  /** Outputs computed from the identities above. */
  derived: IAutoMovieDerivedArtifact[];
}
