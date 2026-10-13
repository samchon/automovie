import { IAutoMovieShotStoryTime } from "@automovie/interface";

/**
 * Map one shot-local time in seconds onto the production story clock,
 * `originSeconds + localSeconds * rate`, with an omitted rate meaning `1`.
 *
 * The map is affine, so a shot that stretches or compresses time still lands on
 * the same clock as one that does not. Nothing is validated here: a non-finite
 * input, or an overflow, yields a non-finite story time.
 * `validateProductionDesign` refuses a pin with a non-finite origin or a rate
 * that is not finite and positive, and `evaluateAutoMovieStorySync` reports a
 * non-finite result as an unresolved operand.
 *
 * @evidence contracts/common.md#principled-implementation The interface defines story time as `originSeconds + t * rate` with an omitted rate of one, and this evaluates exactly that expression in double precision, one multiply and one add, with no clamping or rounding.
 * @evidence contracts/common.md#clear-and-simple-design The single definition of the story map; `autoMovieStoryInterval`, through which `validateProductionDesign` maps event windows, `evaluateAutoMovieStorySync` and `inheritProductionLighting` all call it, so the rate default lives in one place.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No caller, shot or rate is special-cased, and invalid pins are left to the callers that own their diagnostics instead of being silently defaulted here.
 * @evidence contracts/common.md#meaningful-documentation States the formula and the rate default, the unit, that nothing is validated and what invalid input yields, and how the validating callers handle it.
 * @evidence contracts/performance.md#efficient-algorithms One multiply and one add per call, constant time with no allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure scalar map with no coordination across calls; recomputing it is cheaper than any lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a number, allocates nothing, and keeps no reference to the pin after returning.
 */
export const autoMovieStoryTime = (
  pin: IAutoMovieShotStoryTime,
  localSeconds: number,
): number => pin.originSeconds + localSeconds * (pin.rate ?? 1);
