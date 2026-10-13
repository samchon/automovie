/**
 * How a bound water feature is evaluated over shot time.
 *
 * In the engine's `lowerWaterFeature`, `static` always reads the authored step-0
 * state, while `flowing` and `simulated` both read the fixed-step solve at the
 * shot second, snapped down to a whole step, so two features over one domain
 * never disagree about where the water is. The only difference between those
 * two is the `flowing` flag the viewer's `buildFluidSurfaceObject` stores in
 * the surface mesh's `userData`, and no shader in this repository reads it yet.
 * `validateWaterFeatures` refuses any other string.
 *
 * Neither function has a caller in the shot pipeline yet: a compiled shot's
 * render metrics budget a bound domain the same way in every mode.
 *
 * @evidence contracts/common.md#principled-implementation `lowerWaterFeature` calls `simulateFluidDomain(domain, 0)` for `static` and `sampleFluidDomain(domain, time)` otherwise, so the mode chooses which absolute step is read and never changes the solve itself.
 * @evidence contracts/common.md#clear-and-simple-design Three values separate a frozen pool from a solved one and mark the solved one for ripple scrolling; a separate surface-animation flag would duplicate the third distinction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `flowing` does not run a different solver or alter the state, so it cannot desynchronize water shared by two features; the remaining gaps are that no shader consumes its flag and no shot-pipeline caller lowers features per frame.
 * @evidence contracts/common.md#meaningful-documentation States which step each value reads and in which function, the snapping, why features over one domain agree, the only effect of `flowing`, the validator's refusal, and that the shot pipeline does not yet honor the mode.
 * @author Samchon
 */
export type AutoMovieWaterFeatureMode = "static" | "flowing" | "simulated";
