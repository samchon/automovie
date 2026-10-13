/**
 * Whether a bound furnishing requests authored rest or supported shot-time simulation.
 *
 * @evidence contracts/common.md#principled-implementation Rest selects the explicit rest configuration while simulated invokes admitted soft-domain evaluation at shot time, subject to solver budget and moving-boundary admission.
 * @evidence contracts/common.md#clear-and-simple-design Two choices express the production's computational intent without mixing it with furnishing kind or solver selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unavailable simulation cannot silently substitute rest and claim solved output; rest is an explicit requested state.
 * @evidence contracts/common.md#meaningful-documentation Defines rest versus simulated evaluation ownership over the shot clock.
 * @author Samchon
 */
export type AutoMovieSoftFurnishingMode = "rest" | "simulated";
