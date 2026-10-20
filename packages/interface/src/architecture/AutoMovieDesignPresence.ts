/**
 * Whether one subject is in place once a phase has completed.
 *
 * A phase plan is a graph, not a line, so `pending` also covers a subject
 * installed on a branch that neither precedes nor follows this phase, rather
 * than inventing an order between independent branches.
 *
 * The completed phases are the asked phase and its transitive prerequisites. A
 * subject is `removed` when its removing phase is among them, otherwise
 * `present` when it predates the work or its introducing phase is among them,
 * otherwise `pending`. Asking for no phase means the completed work, where
 * everything with a removing phase is removed and everything else is present.
 *
 * @evidence contracts/common.md#principled-implementation `designLineagePhaseSnapshot` collects the asked phase and its transitive `requires` by breadth-first walk and applies the removed, present, pending precedence against that set; a null phase marks every removal reached.
 * @evidence contracts/common.md#clear-and-simple-design Three closed literals answer one per-phase question, kept apart from the plan-wide lifecycle role so each union has one meaning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Incomparable branches are reported as `pending` rather than ordered by declaration position or phase name, and an undeclared phase id throws instead of defaulting to the completed work.
 * @evidence contracts/common.md#meaningful-documentation States which phases count as completed, the exact precedence among the three values, how incomparable branches are answered, and what asking for no phase means.
 */
export type AutoMovieDesignPresence = "pending" | "present" | "removed";
