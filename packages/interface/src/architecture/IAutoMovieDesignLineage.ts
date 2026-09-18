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
 * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `IAutoMovieDesignLineage` as the portable data boundary for the provenance lineage gaps requirement.
 * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `IAutoMovieDesignLineage` for the evp lineage gap representation system contract.
 */
export interface IAutoMovieDesignLineage {
  /**
   * Schema version.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `version` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `version` for the evp lineage gap representation system contract.
   */
  version: 1;
  /**
   * Stable lineage identity within the production.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `id` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `id` for the evp lineage gap representation system contract.
   */
  id: string;
  /**
   * Revision the work is on now; every derived artifact must stamp it.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `head` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `head` for the evp lineage gap representation system contract.
   */
  head: string;
  /**
   * Every identity this lineage speaks about.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `subjects` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `subjects` for the evp lineage gap representation system contract.
   */
  subjects: IAutoMovieDesignSubject[];
  /**
   * Every recorded state of the authored source; at least one.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `revisions` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `revisions` for the evp lineage gap representation system contract.
   */
  revisions: IAutoMovieDesignRevision[];
  /**
   * The construction plan, as a graph of prerequisites.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `phases` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `phases` for the evp lineage gap representation system contract.
   */
  phases: IAutoMovieDesignPhase[];
  /**
   * Exactly one entry per declared subject.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `lifecycles` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `lifecycles` for the evp lineage gap representation system contract.
   */
  lifecycles: IAutoMovieDesignLifecycle[];
  /**
   * Alternatives preserved side by side over their base revisions.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `variants` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `variants` for the evp lineage gap representation system contract.
   */
  variants: IAutoMovieDesignVariant[];
  /**
   * Open and settled comparisons between those alternatives.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `decisions` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `decisions` for the evp lineage gap representation system contract.
   */
  decisions: IAutoMovieDesignDecision[];
  /**
   * Outputs computed from the identities above.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `derived` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `derived` for the evp lineage gap representation system contract.
   */
  derived: IAutoMovieDerivedArtifact[];
}
