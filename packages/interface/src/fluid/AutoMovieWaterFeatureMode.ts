/**
 * How a bound water feature is evaluated over shot time.
 *
 * lowerWaterFeature reads authored step zero for static and sampleFluidDomain's snapped shot time for flowing/simulated: floor(max(time, 0) / fixedStepSeconds + 1e-9), with a step-fraction boundary allowance. The latter two share a state for the same domain and time; a static feature can intentionally differ from a solved feature. The viewer stores flowing as userData metadata, which no maintained stock shader consumes, and validateWaterFeatures refuses other strings.
 *
 * Per-frame shot rendering does not yet call this lowering/viewer pair. Compiled-shot metrics budget bound domains the same way in every mode.
 *
 * @evidence contracts/common.md#principled-implementation `lowerWaterFeature` calls `simulateFluidDomain(domain, 0)` for `static` and `sampleFluidDomain(domain, time)` otherwise, so the mode chooses which absolute step is read and never changes the solve itself.
 * @evidence contracts/common.md#clear-and-simple-design Three values separate a frozen pool from a solved one and mark the solved one for ripple scrolling; a separate surface-animation flag would duplicate the third distinction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Flowing and simulated differ only in viewer metadata, without changing the shared same-time solve; static deliberately selects another step. No stock shader consumes the flowing flag and no production shot-frame caller wires the lowering/viewer pair.
 * @evidence contracts/common.md#meaningful-documentation States the zero-versus-snapped step choice, the same-time premise for solved modes, permitted static/solved disagreement, flowing metadata, closed admission and absent per-frame shot wiring.
 */
export type AutoMovieWaterFeatureMode = "static" | "flowing" | "simulated";
