/**
 * Canonical time key for an interaction event id: six-decimal seconds.
 *
 * @evidence requirements/staging/events-and-timing.md#staging-event-observation eventTimeKey normalizes an interaction instant to six decimals so repeated event construction yields the same observable occurrence id.
 * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-event-boundary-sampling-output eventTimeKey supplies the stable time component used to order and identify boundary-event output.
 */
export const eventTimeKey = (time: number): string => time.toFixed(6);
