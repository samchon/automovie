/**
 * A guarded project operation no longer observes its admitted input generation.
 *
 * Project transactions throw this boundary error before accepting a changed
 * revision, root, namespace or input closure. Compilation converts it to a
 * source-attributed refusal only while it can still observe the current
 * revision; an observation failure must retain both causes instead.
 *
 * @evidence requirements/agent-authoring/partial-work.md#agent-atomic-compilation Prevents changed input generations from being accepted as the current compilation target.
 * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-atomic-invariant Identifies the guarded generation mismatch that leaves the attempted target without a current publication.
 */
export class AutoMovieProductionInputRaceError extends Error {}
