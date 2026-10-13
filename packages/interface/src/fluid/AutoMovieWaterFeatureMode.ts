/**
 * How a bound water feature is evaluated over shot time.
 *
 * `static` always reads the authored step-0 state, while `flowing` and
 * `simulated` both read the fixed-step solve at the shot second, so two
 * features over one domain never disagree about where the water is. The only
 * difference between those two is the `flowing` flag the viewer stores in the
 * surface mesh's `userData`; no shader in this repository reads it yet.
 *
 * @evidence contracts/common.md#principled-implementation `lowerWaterFeature` reads `simulateFluidDomain(domain, 0)` for `static` and `sampleFluidDomain` at the shot second otherwise, so a mode picks a step and never a different solve; the ripple scrolling `flowing` asks for is unresolved, since nothing consumes the viewer's `userData.flowing` flag or `aFlow` attribute.
 * @evidence contracts/common.md#clear-and-simple-design Three literals for three evaluation policies; `flowing` versus `simulated` is a renderer hint rather than a solver option because both must share one depth field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The `static` branch is a contract discriminant, not a consumer special case; `validateWaterFeatures` re-lists the three literals in its own `FEATURE_MODES` set rather than deriving them from this union.
 * @evidence contracts/common.md#meaningful-documentation States which step each mode reads, that both non-static modes share the solve, and that the `flowing` hint currently has no reader.
 * @author Samchon
 */
export type AutoMovieWaterFeatureMode = "static" | "flowing" | "simulated";
