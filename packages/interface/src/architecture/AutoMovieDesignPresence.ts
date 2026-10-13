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
 *
 * @evidence contracts/common.md#principled-implementation Presence is evaluated against the asked phase plus the transitive closure of its `requires` lists, so only phases ordered before it count as complete and a subject on an incomparable branch stays `pending`.
 * @evidence contracts/common.md#clear-and-simple-design Three literals answer the per-phase question apart from the whole-plan role, and `designLineagePhaseSnapshot` derives both from the same lifecycle record in one pass.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No total order is invented between independent branches, and removal is tested before installation, so a subject whose removing phase is complete reads `removed` whatever its introduction.
 * @evidence contracts/common.md#meaningful-documentation States the graph semantics behind `pending`, which phases count as complete, the precedence of removal, and the meaning of asking for no phase.
 */
export type AutoMovieDesignPresence = "pending" | "present" | "removed";
