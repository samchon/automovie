/**
 * Whether a bound furnishing requests authored rest or supported shot-time simulation.
 *
 * @evidence contracts/common.md#principled-implementation lowerSoftFurnishing selects an anchored rest configuration or static fixed-step evaluation at shot time after pair/domain/state and budget checks. It does not supply moving boundaries; body capsules are refused by the static solver and moving-anchor metadata alone does not make this a live solve.
 * @evidence contracts/common.md#clear-and-simple-design Two choices express the production's computational intent without mixing it with furnishing kind or solver selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unavailable simulation cannot silently substitute rest and claim solved output; rest is an explicit requested state.
 * @evidence contracts/common.md#meaningful-documentation Defines rest versus simulated evaluation ownership over the shot clock.
 * @author Samchon
 */
export type AutoMovieSoftFurnishingMode = "rest" | "simulated";
