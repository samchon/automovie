import { IAutoMovieDerivedArtifact } from "./IAutoMovieDerivedArtifact";
import { IAutoMovieDesignDecision } from "./IAutoMovieDesignDecision";
import { IAutoMovieDesignLifecycle } from "./IAutoMovieDesignLifecycle";
import { IAutoMovieDesignPhase } from "./IAutoMovieDesignPhase";
import { IAutoMovieDesignRevision } from "./IAutoMovieDesignRevision";
import { IAutoMovieDesignSubject } from "./IAutoMovieDesignSubject";
import { IAutoMovieDesignVariant } from "./IAutoMovieDesignVariant";

/**
 * Phases, alternatives, and derivation for one work, over identities other
 * graphs own.
 *
 * Nothing here is a building. The record annotates ids that already exist
 * elsewhere, which is what keeps a renovation from being modelled as a second
 * building and an alternative from being modelled as a third. A production that
 * declares no lineage at all is unaffected: this fold is additive, and its
 * absence means only that no phase or alternative claim is being made.
 *
 * A shot's lineage is validated for coherence when the shot compiles, and its
 * subjects are bound to the ids the production publishes when the production
 * builds. A stale derived artifact is a refusal, not a warning.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignLineage {
  /** Schema version. */
  version: 1;

  /**
   * Stable lineage identity within the production.
   *
   * Reuse is not refused: when two shots declare different lineages under one
   * id, the production build binds only the one it reads last.
   */
  id: string;

  /** Revision the work is on now; every derived artifact must stamp it. */
  head: string;

  /** Every identity this lineage speaks about. */
  subjects: IAutoMovieDesignSubject[];

  /** Every recorded state of the authored source; at least one. */
  revisions: IAutoMovieDesignRevision[];

  /** The construction plan, as a graph of prerequisites. */
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
