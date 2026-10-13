import { AutoMovieAnalysisDomain } from "@automovie/interface";

import { AUTOMOVIE_ANALYSIS_DOMAINS } from "./constants/AUTOMOVIE_ANALYSIS_DOMAINS";

/**
 * Type guard for a rollable analysis domain.
 *
 * True exactly when `value` is one of the strings in
 * `AUTOMOVIE_ANALYSIS_DOMAINS`; any other value, including a differently cased
 * string, is false. The run validator reports a false result as an unknown
 * domain, and the report summary throws on it for a required domain.
 */
export const isAutoMovieAnalysisDomain = (
  value: unknown,
): value is AutoMovieAnalysisDomain =>
  (AUTOMOVIE_ANALYSIS_DOMAINS as readonly unknown[]).includes(value);
