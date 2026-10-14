/**
 * How many gaps one report may list before counting the rest.
 *
 * The report has to be readable at a glance to be read at all, so it names the
 * first gaps in run order and counts the remainder. The count is always stated:
 * a bound nobody can see is indistinguishable from a clean sheet.
 */
export const AUTOMOVIE_ANALYSIS_REPORT_MAX_GAPS = 16;
