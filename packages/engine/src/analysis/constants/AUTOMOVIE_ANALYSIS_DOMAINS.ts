/**
 * Every analysis domain, in the fixed order every report rolls up in.
 *
 * One table, so a domain added here appears in every rollup at once instead of
 * being remembered in some of the places that enumerate domains.
 *
 * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-completeness-determinism `AUTOMOVIE_ANALYSIS_DOMAINS` fixes the complete domain vocabulary and the order in which analysis outcomes roll up.
 * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-result-completeness-determinism The single ordered table gives validation and summaries the same deterministic domain traversal.
 */
export const AUTOMOVIE_ANALYSIS_DOMAINS = [
  "daylight",
  "artificial-light",
  "thermal",
  "moisture",
  "air",
  "acoustic",
] as const;
