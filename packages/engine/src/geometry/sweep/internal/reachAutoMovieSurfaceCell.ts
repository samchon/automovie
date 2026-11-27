/*
 * The spacing a sample gives its cell below and above one axis, infinite where
 * that side is not reached.
 * Parameter step: Signed spacing between adjacent samples
 * Parameter first: Whether this is the first sample
 * Parameter last: Whether this is the last sample
 * Returns: Below and above spacing; negative steps reverse the end roles
 */
export function reachAutoMovieSurfaceCell(
  step: number,
  first: boolean,
  last: boolean,
): [number, number] {
  const size: number = Math.abs(step);
  if (step === 0) return [Infinity, Infinity];
  const back: number = first ? Infinity : size;
  const ahead: number = last ? Infinity : size;
  return step > 0 ? [back, ahead] : [ahead, back];
}
