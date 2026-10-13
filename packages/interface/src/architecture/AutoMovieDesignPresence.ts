/**
 * Whether one subject is in place once a phase has completed.
 *
 * A phase plan is a graph, not a line, so `pending` also covers a subject
 * installed on a branch that neither precedes nor follows this phase. Saying
 * "not yet here" about work that is merely incomparable is the honest answer;
 * inventing an order between independent branches is not.
 *
 * The completed phases are the asked phase and its transitive prerequisites. A
 * subject is `removed` when its removing phase is among them, otherwise
 * `present` when it predates the work or its introducing phase is among them,
 * otherwise `pending`. Asking for no phase means the completed work, where
 * everything with a removing phase is removed and everything else is present.
 */
export type AutoMovieDesignPresence = "pending" | "present" | "removed";
