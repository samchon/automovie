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
 * @evidence contracts/common.md#principled-implementation `Array.prototype.includes` over the constant domain tuple, whose SameValueZero comparison is exact string equality for these members, so membership is the definition of the `AutoMovieAnalysisDomain` union.
 * @evidence contracts/common.md#clear-and-simple-design Reads the one domain table instead of restating the union, so a domain added there becomes valid here, in the run validator, and in the report rollup together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The `readonly unknown[]` cast only widens the tuple's element type so `includes` accepts an `unknown` argument; it adds no runtime behavior and no domain is singled out.
 * @evidence contracts/common.md#meaningful-documentation States the membership rule, that case variants are rejected, and what each caller does with a false result.
 * @evidence contracts/performance.md#cost-and-resources A linear `includes` over a fixed six-entry constant tuple, so each call is constant cost; a hashed set would add a second representation of the table for no asymptotic change. Caches and retains nothing.
 */
export const isAutoMovieAnalysisDomain = (
  value: unknown,
): value is AutoMovieAnalysisDomain =>
  (AUTOMOVIE_ANALYSIS_DOMAINS as readonly unknown[]).includes(value);
