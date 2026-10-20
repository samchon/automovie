/**
 * Every analysis domain a run may answer for.
 *
 * The list is closed because the report rolls up by domain and a rollup over an
 * open vocabulary silently loses whatever it has never heard of. Naming a
 * domain here is not a claim that it is solved: a domain with no adapter is
 * answered by an `unsupported` run.
 *
 * Reports roll up in the order of the engine's `AUTOMOVIE_ANALYSIS_DOMAINS`
 * table, not the member order of this union.
 *
 * @evidence contracts/common.md#principled-implementation A closed string union mirrored by the engine's `AUTOMOVIE_ANALYSIS_DOMAINS` table, which `isAutoMovieAnalysisDomain` checks so run validation refuses an unknown domain and the summarizer throws on one it is asked to require.
 * @evidence contracts/common.md#clear-and-simple-design Plain literals with no per-domain metadata; ordering and the guard live in the engine table, keeping this package free of runtime values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Membership makes no adapter or completeness claim: the envelope solver emits a solved moisture run with an unsupported interstitial-condensation metric. A wholly unavailable adapter is reported as unsupported rather than a fabricated measurement.
 * @evidence contracts/common.md#meaningful-documentation States why the list is closed, that membership does not imply an adapter exists, and which table fixes the rollup order.
 */
export type AutoMovieAnalysisDomain =
  | "daylight"
  | "artificial-light"
  | "thermal"
  | "moisture"
  | "air"
  | "acoustic";
