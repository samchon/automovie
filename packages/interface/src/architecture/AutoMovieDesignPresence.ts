/**
 * Whether one subject is in place once a phase has completed.
 *
 * A phase plan is a graph, not a line, so `pending` also covers a subject
 * installed on a branch that neither precedes nor follows this phase. Saying
 * "not yet here" about work that is merely incomparable is the honest answer;
 * inventing an order between independent branches is not.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `AutoMovieDesignPresence` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `AutoMovieDesignPresence` for the narrative intent reference lineage system contract.
 */
export type AutoMovieDesignPresence = "pending" | "present" | "removed";
