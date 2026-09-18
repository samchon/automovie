/**
 * The sampling grid over `[start, end]`, see the module contract.
 *
 * @evidence requirements/motion/timing-and-semantic-events.md#motion-boundary-sampling Includes both requested endpoints and every fixed-rate interior inspection instant.
 * @evidence requirements/motion/validation-and-determinism.md#motion-interior-sample-validation Enumerates the deterministic interior instants at which downstream artifact validation samples the motion.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clock-semantic-event Applies one deterministic boundary law to an arbitrary sampling window.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-deterministic-sampling-validation Supplies the endpoint-inclusive fixed-rate grid used to validate motion between authored boundaries.
 */
export const windowSampleTimes = (
  start: number,
  end: number,
  sampleRate: number,
): number[] => {
  const frames = Math.max(1, Math.ceil((end - start) * sampleRate));
  const times = Array.from({ length: frames + 1 }, (_, index) =>
    Math.min(end, start + index / sampleRate),
  );
  // FP can land (end − start) × rate just above an integer; the extra instant
  // clamps onto `end` and duplicates it, a zero-width segment downstream
  // validators would divide by (#1012).
  if (times.length > 1 && times[times.length - 1] === times[times.length - 2])
    times.pop();
  return times;
};
