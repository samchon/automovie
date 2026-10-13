/**
 * A guarded project operation no longer observes its admitted input generation.
 *
 * Project transactions throw this boundary error before accepting a changed
 * revision, root, namespace or input closure. Compilation converts it to a
 * source-attributed refusal only while it can still observe the current
 * revision; an observation failure must retain both causes instead.
 */
export class AutoMovieProductionInputRaceError extends Error {}
