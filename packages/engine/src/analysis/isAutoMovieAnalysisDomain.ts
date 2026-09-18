import { AutoMovieAnalysisDomain } from "@automovie/interface";
import { AUTOMOVIE_ANALYSIS_DOMAINS } from "./AUTOMOVIE_ANALYSIS_DOMAINS";

/**
 * Test whether a value names a rollable analysis domain.
 *
 * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-completeness-determinism `isAutoMovieAnalysisDomain` rejects unknown domain labels before they can disappear from a fixed-order rollup.
 * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-result-completeness-determinism The predicate checks runtime values against the canonical domain table used by collection and summary.
 */
export const isAutoMovieAnalysisDomain = (
  value: unknown,
): value is AutoMovieAnalysisDomain =>
  (AUTOMOVIE_ANALYSIS_DOMAINS as readonly unknown[]).includes(value);
