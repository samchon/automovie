/**
 * Whether a bound furnishing requests authored rest or supported shot-time simulation.
 *
 * @evidence contracts/development/design.md#principled-representation lowerSoftFurnishing selects an anchored rest configuration or static fixed-step evaluation at shot time after pair/domain/state and budget checks. It does not supply moving boundaries; body capsules are refused by the static solver and moving-anchor metadata alone does not make this a live solve.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two choices express the production's computational intent without mixing it with furnishing kind or solver selection.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An unavailable simulation cannot silently substitute rest and claim solved output; rest is an explicit requested state.
 * @evidence contracts/development/common.md#meaningful-documentation Defines rest versus simulated evaluation ownership over the shot clock.
 */
export type AutoMovieSoftFurnishingMode = "rest" | "simulated";
