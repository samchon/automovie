/** Half the detailed editor's 0.1 mm readout interval, in metres. */
const HALF_READOUT_METRES = 0.00005;

/**
 * Invert a measured body's bounded, one-dimensional response by a safeguarded
 * secant and midpoint bracket.
 *
 * The caller owns the anatomical instrument and its shaped-skin reading; this
 * function owns only the numerical inverse. It checks the actual reading at
 * both endpoint weights, refuses targets outside their reach, and first
 * checks the midpoint for a response that reverses the enclosing readings.
 * Subsequent steps alternate a secant estimate with a midpoint, so an affine
 * response needs one interior solve and every two steps still shrink a
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
 * @evidence contracts/common.md#principled-implementation Endpoint readings bracket the target, so a continuous response has a root inside; alternating a secant estimate (kept only while strictly inside the bracket) with a midpoint shrinks the bracket at least by half every two steps, and the loop ends within half the 0.1 mm readout or when binary64 cannot split the bracket. The premise is a bracket-consistent response: a flat response, a reading outside the endpoint span by more than the readout, and a discontinuity that never reaches the readout are each refused instead of extrapolated.
 * @evidence contracts/common.md#clear-and-simple-design One function owns only the numerical inverse; the instrument, the channel and the shaped skin stay with the caller through the read callback, so there is no layer or option beyond the bracket state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No target, person or measurement is special-cased; an unreachable target is refused with the reach rather than clamped, and no secondary channel or vertex is invented to make a target fit.
 * @evidence contracts/common.md#meaningful-documentation States the method, who owns the instrument, the readout stop rule, the refusal effects and the meaning of `current` (an equal target returns the existing weight so detailed residue survives).
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part or group; it sees one scalar weight.
 * @evidenceExclude contracts/modeling.md#parameter-channels It receives a weight range and a current weight with no knowledge of any channel's trait, neutral or positive direction; the caller owns the channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Targets and readings are metres, the weight is the caller's dimensionless channel weight, and the 0.1 mm readout interval is stated in metres; no frame or unit is converted.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface or boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no part, group or joint a viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The caller's measurement rule defines the instrument. The only constant is the editor's 0.1 mm readout interval, a display resolution and not an anatomical value.
 * @evidence contracts/anatomy.md#permitted-range A target is admitted only inside the reach the endpoint readings span; outside it the call refuses naming that reach, with no clamping or extrapolation, and neither the range nor the current weight is changed. The range is the caller's channel envelope, and combinations of several channels are outside this one-dimensional owner.
 * @evidence contracts/anatomy.md#parametric-authority It is the deterministic inverse of a named measurement in metres to a channel weight: the same readings give the same weight, and the forward direction is the caller's reading of that same rule. Only a metric target and a scalar weight enter, so no input addresses a vertex, curve, strand or patch; a flat, reversing or discontinuous response has no inverse and is refused.
 */
export function invertHumanBodyMeasurement(input: {
  range: [number, number];
  current: number;
  targetMetres: number;
  read: (weight: number) => number;
  label: string;
}): { weight: number; actualMetres: number } {
  const { range, current, targetMetres, label } = input;
  if (
    !Number.isFinite(range[0]) ||
    !Number.isFinite(range[1]) ||
    range[0] >= range[1] ||
    !Number.isFinite(current) ||
    current < range[0] ||
    current > range[1]
  )
    throw new Error(
      "A body measurement inverse needs a finite ordered range containing the current weight.",
    );
  if (!Number.isFinite(targetMetres))
    throw new Error("A body measurement target must be finite metres.");
  const read = (weight: number): number => {
    const value = input.read(weight);
    if (!Number.isFinite(value))
      throw new Error("The current body cannot measure " + label + ".");
    return value;
  };
  const original = read(current);
  if (Math.abs(targetMetres - original) <= HALF_READOUT_METRES)
    return { weight: current, actualMetres: original };
  let low = range[0];
  let high = range[1];
  let atLow = read(low);
  let atHigh = read(high);
  const increasing = atHigh > atLow;
  if (
    atLow === atHigh ||
    targetMetres < Math.min(atLow, atHigh) ||
    targetMetres > Math.max(atLow, atHigh)
  )
    throw new Error(
      `The current body reaches ${Math.min(atLow, atHigh)} to ${Math.max(atLow, atHigh)} metres for ${label}, not ${targetMetres}.`,
    );
  if (Math.abs(targetMetres - atLow) <= HALF_READOUT_METRES)
    return { weight: low, actualMetres: atLow };
  if (Math.abs(targetMetres - atHigh) <= HALF_READOUT_METRES)
    return { weight: high, actualMetres: atHigh };
  let useSecant = false;
  while (true) {
    const middle = low + (high - low) / 2;
    if (middle === low || middle === high) break;
    const estimate =
      low + ((targetMetres - atLow) * (high - low)) / (atHigh - atLow);
    const candidate =
      useSecant && estimate > low && estimate < high ? estimate : middle;
    useSecant = !useSecant;
    const atCandidate = candidate === current ? original : read(candidate);
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
  const selected =
    Math.abs(atLow - targetMetres) <= Math.abs(atHigh - targetMetres)
      ? { weight: low, actualMetres: atLow }
      : { weight: high, actualMetres: atHigh };
  if (Math.abs(selected.actualMetres - targetMetres) > HALF_READOUT_METRES)
    throw new Error("The body cannot reach " + label + " within 0.1 mm.");
  return selected;
}
