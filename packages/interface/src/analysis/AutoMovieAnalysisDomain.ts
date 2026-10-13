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
 *
 * @evidence contracts/common.md#principled-implementation A closed string-literal union lets a report keep one rollup row per domain; runs are admitted through `isAutoMovieAnalysisDomain`, a membership test against the engine's six-name table, so an unknown domain is refused at validation rather than dropped from the rollup.
 * @evidence contracts/common.md#clear-and-simple-design The six names exist twice, here and in the engine table that fixes rollup order; the rollup map's key type rejects a table name outside this union, but a union member missing from the table still compiles and would only be refused at run validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No member is special-cased by the type; whether a domain has a solver is stated per run by its outcome arm rather than by leaving the name out of this list.
 * @evidence contracts/common.md#meaningful-documentation Explains why the list is closed, that naming a domain claims no solver, and that rollup order comes from the engine table rather than from this declaration.
 */
export type AutoMovieAnalysisDomain =
  | "daylight"
  | "artificial-light"
  | "thermal"
  | "moisture"
  | "air"
  | "acoustic";
