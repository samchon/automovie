/**
 * How far a derived document's priors may go before its skin passes through
 * itself.
 *
 * Every control's envelope is valid alone, and their combinations are not
 * checked by any envelope: on round j13 the built skin of 11 of the 17
 * documents crossed itself at rest (up to 276 pairs of triangles), the
 * nasal base passing through the upper lip where the nose was lengthened to
 * the photograph's index, the columella turned to the septum's end by the
 * nasolabial norm and the mouth set back by the E-line norm; any one of the
 * three alone left the skin whole. Tissue does not pass through tissue, so
 * a document is valid only if its skin at rest has no fault its neutral
 * lacks (`faceSupportFaults`). What the photograph measured stands; the
 * priors for what it cannot show (`FACE_UNSEEN_INDICES`) yield: their
 * departure from the start is scaled by the largest factor in [0, 1] at
 * which they add no fault to those of the measured controls alone (the
 * factor 0), found by bisection over `steps` halvings; the faults the
 * measured controls make themselves are reported. Pure.
 */
export function faceValidScale(props: {
  /** The document's faults with the priors' departure scaled by a factor. */
  faults: (scale: number) => number;
  steps: number;
}): { scale: number; faults: number } {
  if (!(Number.isInteger(props.steps) && props.steps >= 1))
    throw new Error("A bisection needs one step or more.");
  const whole = props.faults(1);
  if (whole === 0) return { scale: 1, faults: 0 };
  const measured = props.faults(0);
  if (whole <= measured) return { scale: 1, faults: whole };
  let [low, high] = [0, 1];
  let faults = measured;
  for (let k = 0; k < props.steps; ++k) {
    const middle = (low + high) / 2;
    const count = props.faults(middle);
    if (count <= measured) [low, faults] = [middle, count];
    else high = middle;
  }
  return { scale: low, faults };
}
