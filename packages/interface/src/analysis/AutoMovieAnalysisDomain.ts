/**
 * Every analysis domain a run may answer for.
 *
 * The list is closed because the report rolls up by domain and a rollup over an
 * open vocabulary silently loses whatever it has never heard of. Naming a
 * domain here is not a claim that it is solved: a domain with no adapter is
 * answered by an `unsupported` run, which is the point of the vocabulary.
 *
 * The order reports roll up in is the engine's `AUTOMOVIE_ANALYSIS_DOMAINS`
 * table, not the member order of this union.
 */
export type AutoMovieAnalysisDomain =
  | "daylight"
  | "artificial-light"
  | "thermal"
  | "moisture"
  | "air"
  | "acoustic";
