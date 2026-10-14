import type { IHumanMeasurementInverseInput } from "../structures/IHumanMeasurementInverseInput";
import type { IHumanMeasurementInverseResult } from "../structures/IHumanMeasurementInverseResult";

/** Half the detailed editor's 0.1 mm readout interval, in metres. */
const HALF_READOUT_METRES: number = 0.00005;

/**
 * Invert a measured shape's bounded, one-dimensional response by a safeguarded
 * secant and midpoint bracket.
 *
 * The caller owns the anatomical instrument and its shaped-skin reading; this
 * function owns only the numerical inverse. It checks the actual reading at
 * both endpoint weights, refuses targets outside their reach, and first
 * checks the midpoint for a response that reverses the enclosing readings.
 * Subsequent steps alternate a secant estimate with a midpoint, so an affine
 * response reaches its target at the first secant after the midpoint check,
 * and every two subsequent steps still shrink a
 * nonlinear bracket by at least half. It stops when the result is
 * within half the detailed editor's 0.1 mm readout interval, or when IEEE-754
 * cannot split the bracket further. A discontinuous reading that never
 * reaches that interval refuses. No vertex displacement or secondary channel
 * is invented to make a target fit.
 *
 * `current` is the existing channel weight. A target already equal at this
 * resolution returns it unchanged, preserving the document's detailed
 * residue when a user repeats the value on screen.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation A safeguarded secant/midpoint bracket inverts the caller's finite stable one-dimensional reading; endpoint reach and sampled reversals refuse, while 0.05 mm readout error or unsplittable binary64 brackets terminate. Sampling does not prove global monotonicity.
 * @evidence contracts/common.md#clear-and-simple-design The numerical inverse owns brackets and resolution; body/person/face callers own the instrument, source reach, unchanged other channels and trial geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The resolution is half the actual editor's 0.1 mm interval; no vertex displacement, secondary channel, expected specimen result or extrapolated endpoint hides an unreachable target.
 * @evidence contracts/common.md#meaningful-documentation The prose gives safeguarded stepping, endpoint/reversal refusal, representational stopping and unchanged-current behavior for repeated equivalent readouts.
 * @evidence contracts/performance.md#efficient-algorithms For K trial readings costing M each, work is O(K*M) plus scalar bracketing and O(1) inverse state; actual reader allocations/costs remain caller-owned and K depends on response/range convergence.
 * @evidence contracts/performance.md#reuse-equivalent-work Current reading is evaluated once and reused when a candidate equals current; endpoint values update in place, with no cross-call cache assuming unchanged caller geometry or reading effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The inverse retains only scalar bracket/readout state during the synchronous call; trial-reader resources stay with their owner and the two-scalar result transfers without a task, handle or persistent registry.
 */
export function invertHumanMeasurement(
  input: IHumanMeasurementInverseInput,
): IHumanMeasurementInverseResult {
  const { range, current, targetMetres, label }: IHumanMeasurementInverseInput = input;
  if (
    !Number.isFinite(range[0]) ||
    !Number.isFinite(range[1]) ||
    range[0] >= range[1] ||
    !Number.isFinite(current) ||
    current < range[0] ||
    current > range[1]
  )
    throw new Error(
      "A measurement inverse needs a finite ordered range containing the current weight.",
    );
  if (!Number.isFinite(targetMetres))
    throw new Error("A measurement target must be finite metres.");
  const read: (weight: number) => number = (weight: number): number => {
    const value: number = input.read(weight);
    if (!Number.isFinite(value))
      throw new Error("The current shape cannot measure " + label + ".");
    return value;
  };
  const original: number = read(current);
  if (Math.abs(targetMetres - original) <= HALF_READOUT_METRES)
    return { weight: current, actualMetres: original };
  let low: number = range[0];
  let high: number = range[1];
  let atLow: number = read(low);
  let atHigh: number = read(high);
  const increasing: boolean = atHigh > atLow;
  if (
    atLow === atHigh ||
    targetMetres < Math.min(atLow, atHigh) ||
    targetMetres > Math.max(atLow, atHigh)
  )
    throw new Error(
      `The current shape reaches ${Math.min(atLow, atHigh)} to ${Math.max(atLow, atHigh)} metres for ${label}, not ${targetMetres}.`,
    );
  if (Math.abs(targetMetres - atLow) <= HALF_READOUT_METRES)
    return { weight: low, actualMetres: atLow };
  if (Math.abs(targetMetres - atHigh) <= HALF_READOUT_METRES)
    return { weight: high, actualMetres: atHigh };
  let useSecant: boolean = false;
  while (true) {
    const middle: number = low + (high - low) / 2;
    if (middle === low || middle === high) break;
    const estimate: number =
      low + ((targetMetres - atLow) * (high - low)) / (atHigh - atLow);
    const candidate: number =
      useSecant && estimate > low && estimate < high ? estimate : middle;
    useSecant = !useSecant;
    const atCandidate: number = candidate === current ? original : read(candidate);
    if (
      atCandidate < Math.min(atLow, atHigh) - HALF_READOUT_METRES ||
      atCandidate > Math.max(atLow, atHigh) + HALF_READOUT_METRES
    )
      throw new Error("The measured response reverses inside " + label + ".");
    if (Math.abs(atCandidate - targetMetres) <= HALF_READOUT_METRES)
      return { weight: candidate, actualMetres: atCandidate };
    if (atCandidate < targetMetres === increasing) {
      low = candidate;
      atLow = atCandidate;
    } else {
      high = candidate;
      atHigh = atCandidate;
    }
  }
  const selected: IHumanMeasurementInverseResult =
    Math.abs(atLow - targetMetres) <= Math.abs(atHigh - targetMetres)
      ? { weight: low, actualMetres: atLow }
      : { weight: high, actualMetres: atHigh };
  if (Math.abs(selected.actualMetres - targetMetres) > HALF_READOUT_METRES)
    throw new Error("The shape cannot reach " + label + " within 0.1 mm.");
  return selected;
}
