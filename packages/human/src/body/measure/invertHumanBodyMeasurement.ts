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
