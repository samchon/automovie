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
 * Explicit Engine lineage validators check coherence and supplied host identities. Production shot/build integration is retired; callers must invoke those checks and supply current graph identities rather than treating this record as automatic admission.
 *
 * @evidence contracts/common.md#principled-implementation Explicit validateDesignLineage checks identity/reference coherence, acyclic graphs, resolving head, total lifecycles and recorded freshness; validateDesignLineageBinding checks subjects and derived-id collisions against a caller-supplied known-id list. Production orchestration is retired. Neither validator applies variants, inspects output bytes or certifies dependency completeness.
 * @evidence contracts/common.md#clear-and-simple-design One record holds the seven lists a lineage answers from, each owned by its own member type, and points at foreign graphs only through subject ids, so no building type gains a phase or variant field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit coherence validation refuses stale recorded derivations and invents no lifecycle. Cross-shot canonical merging and conflicting-id refusal no longer have a production host, so callers must preserve consistent shared identities.
 * @evidence contracts/common.md#meaningful-documentation States foreign identity annotation, absence semantics, coherence and binding gates, artifact head stamps, minimum revisions and canonical-equality sharing with conflicting-id refusal.
 * @author Samchon
 */
export interface IAutoMovieDesignLineage {
  /** Schema version; validation accepts only `1`. */
  version: 1;

  /**
   * Stable, non-blank lineage identity within the production.
   *
   * Shared lineages should be canonically equal under one id; cross-shot consistency requires an explicit host after production merger retirement.
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
