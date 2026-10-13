/**
 * How a bound water feature is evaluated over shot time.
 *
 * `static` always reads the authored step-0 state, while `flowing` and
 * `simulated` both read the fixed-step solve at the shot second, so two
 * features over one domain never disagree about where the water is. The only
 * difference between those two is the `flowing` flag the viewer stores in the
 * surface mesh's `userData`; no shader in this repository reads it yet.
 *
 * @author Samchon
 */
export type AutoMovieWaterFeatureMode = "static" | "flowing" | "simulated";
