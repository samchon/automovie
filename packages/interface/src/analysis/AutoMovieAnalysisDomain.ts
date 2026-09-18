/**
 * Every analysis domain a run may answer for.
 *
 * The list is closed because the report rolls up by domain and a rollup over an
 * open vocabulary silently loses whatever it has never heard of. Naming a
 * domain here is not a claim that it is solved: a domain with no adapter is
 * answered by an `unsupported` run, which is the point of the vocabulary.
 *
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `AutoMovieAnalysisDomain` as the portable data boundary for the diagnostics failed not run requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `AutoMovieAnalysisDomain` for the validation failed not run states system contract.
 */
export type AutoMovieAnalysisDomain =
  | "daylight"
  | "artificial-light"
  | "thermal"
  | "moisture"
  | "air"
  | "acoustic";
