import { AutoMovieAnalysisDomain } from "@automovie/interface";

import { AUTOMOVIE_ANALYSIS_DOMAINS } from "./constants/AUTOMOVIE_ANALYSIS_DOMAINS";

/**
 * Type guard for a rollable analysis domain.
 *
 * True exactly when `value` is one of the strings in
 * `AUTOMOVIE_ANALYSIS_DOMAINS`; any other value, including a differently cased
 * string, is false. The run validator reports a false result as an unknown
 * domain, and the report summary throws on it for a required domain.
 *
 * @param value Any value, typically a domain read from authored or received data.
 * @returns Whether `value` is a known domain, narrowing its type when true.
 *
 * @evidence contracts/common.md#principled-implementation `Array.prototype.includes` over the constant domain tuple, whose SameValueZero comparison is exact string equality for these members, so membership is the definition of the `AutoMovieAnalysisDomain` union the tuple enumerates.
 * @evidence contracts/common.md#clear-and-simple-design One guard over the one domain table, shared by the run validator and the report summary, so adding a domain to the table is the only change either needs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The `readonly unknown[]` cast only widens the tuple's element type so `includes` accepts an `unknown` argument; it adds no runtime behavior and no domain is singled out.
 * @evidence contracts/common.md#meaningful-documentation The documentation states exact, case-sensitive membership and what each caller does with a false result.
 * @evidence contracts/performance.md#efficient-algorithms A linear `includes` over a fixed six-entry tuple, constant cost per call; a hashed set would add a second representation of the table for no asymptotic change.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate over a constant table, coordinating no work across requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reads the module-level domain tuple in place; no copy, set or handle is created per call.
 */
export const isAutoMovieAnalysisDomain: (
  value: unknown,
) => value is AutoMovieAnalysisDomain = (
  value: unknown,
): value is AutoMovieAnalysisDomain =>
  (AUTOMOVIE_ANALYSIS_DOMAINS as readonly unknown[]).includes(value);
