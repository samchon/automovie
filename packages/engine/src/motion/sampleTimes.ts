import { windowSampleTimes } from "./windowSampleTimes";

/**
 * The sampling grid over `[0, duration]`, see the module contract.
 *
 * @evidence requirements/motion/timing-and-semantic-events.md#motion-boundary-sampling Produces the endpoint-inclusive inspection instants for a complete clip duration.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clock-semantic-event Normalizes the shared window clock to a clip-local zero origin.
 */
export const sampleTimes = (duration: number, sampleRate: number): number[] =>
  windowSampleTimes(0, duration, sampleRate);
