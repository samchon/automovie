/**
 * How many spatial samples one run may carry.
 *
 * A field overlay needs every sample it draws, so this is a refusal rather than
 * a truncation: a request for a grid past the bound is an authoring mistake and
 * says so, instead of quietly drawing a heatmap of a coarser study than the one
 * that was asked for.
 */
export const AUTOMOVIE_ANALYSIS_MAX_SAMPLES = 4096;
