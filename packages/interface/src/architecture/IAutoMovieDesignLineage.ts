import type { IAutoMovieDerivedArtifact } from "./IAutoMovieDerivedArtifact";
import type { IAutoMovieDesignDecision } from "./IAutoMovieDesignDecision";
import type { IAutoMovieDesignLifecycle } from "./IAutoMovieDesignLifecycle";
import type { IAutoMovieDesignPhase } from "./IAutoMovieDesignPhase";
import type { IAutoMovieDesignRevision } from "./IAutoMovieDesignRevision";
import type { IAutoMovieDesignSubject } from "./IAutoMovieDesignSubject";
import type { IAutoMovieDesignVariant } from "./IAutoMovieDesignVariant";

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
 * Explicit Engine lineage validators check coherence and supplied host
 * identities. Production shot/build integration is retired; callers must invoke
 * those checks and supply current graph identities rather than treating this
 * record as automatic admission.
 */
export interface IAutoMovieDesignLineage {
  /** Schema version; validation accepts only `1`. */
  version: 1;

  /**
   * Stable, non-blank lineage identity within the production.
   *
   * Shared lineages should be canonically equal under one id; cross-shot
   * consistency requires an explicit host after production merger retirement.
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
