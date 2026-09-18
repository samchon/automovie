/**
 * How many spatial samples one run may carry.
 *
 * A field overlay needs every sample it draws, so this is a refusal rather than
 * a truncation: a request for a grid past the bound is an authoring mistake and
 * says so, instead of quietly drawing a heatmap of a coarser study than the one
 * that was asked for.
 *
 * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-completeness-determinism `AUTOMOVIE_ANALYSIS_MAX_SAMPLES` makes an oversized spatial field fail visibly instead of silently truncating evidence.
 * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-result-completeness-determinism The 4096-sample ceiling supplies the validator's deterministic refusal boundary for complete overlays.
 */
export const AUTOMOVIE_ANALYSIS_MAX_SAMPLES = 4096;
