

/**
 * Convert an admitted audio presentation duration from movie ticks to media samples. The preceding Opus assertion must already prove positive safe clocks, exact divisibility, and a safe resulting sample count.
 *
 * @evidence contracts/common.md#principled-implementation BigInt multiplication and division preserve the previously proven integral ratio before conversion to number. This helper supplies no independent remainder, positivity, or safe-integer check, so it is only used after the Opus profile assertion.
 * @evidence contracts/common.md#clear-and-simple-design The small arithmetic helper isolates the clock conversion needed by sound evidence without creating another audio profile or measurement verdict.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Division would truncate an unadmitted ratio; the supported caller first requires the Opus exact presentation contract. No rounding tolerance or replacement sample count is introduced.
 * @evidence contracts/common.md#meaningful-documentation The comment gives input units, returned units, prior exact-divisibility and safety requirements, and the absence of a second verdict.
 * @evidence contracts/performance.md#efficient-algorithms One multiplication, one division, and one numeric conversion use space proportional to the integer representations, independent of audio sample population.
 * @evidence contracts/performance.md#reuse-equivalent-work The passed scalar clock facts are consumed directly with no cache or repeated media parsing; the caller reuses its already admitted audio probe.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function creates only temporary integers and returns a scalar, retaining no probe, PCM buffer, handle, or task on success or throw.
 */
export const productionDeliveryValidationExactPresentationTicks: (duration: number, timescale: number, destinationTimescale: number) => number = (
  duration: number,
  timescale: number,
  destinationTimescale: number,
): number =>
  Number((BigInt(duration) * BigInt(destinationTimescale)) / BigInt(timescale));
