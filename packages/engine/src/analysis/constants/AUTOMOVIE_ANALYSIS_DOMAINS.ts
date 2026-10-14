/**
 * Every analysis domain, in the fixed order every report rolls up in.
 *
 * One table, so a domain added here appears in every rollup at once instead of
 * being remembered in some of the places that enumerate domains.
 */
export const AUTOMOVIE_ANALYSIS_DOMAINS = [
  "daylight",
  "artificial-light",
  "thermal",
  "moisture",
  "air",
  "acoustic",
] as const;
