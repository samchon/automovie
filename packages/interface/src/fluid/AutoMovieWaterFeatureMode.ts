/**
 * How a bound water feature is evaluated over shot time.
 *
 * LowerWaterFeature reads authored step zero for static and sampleFluidDomain's
 * snapped shot time for flowing/simulated: floor(max(time, 0) /
 * fixedStepSeconds + 1e-9), with a step-fraction boundary allowance. The latter
 * two share a state for the same domain and time; a static feature can
 * intentionally differ from a solved feature. The viewer stores flowing as
 * userData metadata, which no maintained stock shader consumes, and
 * validateWaterFeatures refuses other strings.
 *
 * Per-frame shot rendering does not yet call this lowering/viewer pair.
 * Compiled-shot metrics budget bound domains the same way in every mode.
 */
export type AutoMovieWaterFeatureMode = "static" | "flowing" | "simulated";
