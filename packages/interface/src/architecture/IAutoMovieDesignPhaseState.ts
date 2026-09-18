import { AutoMovieDesignLifecycleRole } from "./AutoMovieDesignLifecycleRole";
import { AutoMovieDesignPresence } from "./AutoMovieDesignPresence";

/**
 * One subject's classification and presence at one phase.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignPhaseState` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignPhaseState` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignPhaseState {
  /**
   * Declared subject id.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `subject` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `subject` for the narrative intent reference lineage system contract.
   */
  subject: string;
  /**
   * The graph that owns the id, carried through from its declaration.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `graph` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `graph` for the narrative intent reference lineage system contract.
   */
  graph: string;
  /**
   * How the subject relates to the work as a whole.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `role` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `role` for the narrative intent reference lineage system contract.
   */
  role: AutoMovieDesignLifecycleRole;
  /**
   * Whether it is in place once this phase completes.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `presence` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `presence` for the narrative intent reference lineage system contract.
   */
  presence: AutoMovieDesignPresence;
}
