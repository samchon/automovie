/*
 * Sample a finite ordered seconds window at a finite positive Hz rate,
 * retaining both endpoints and coalescing instants that round together. A
 * zero-width window returns one instant; the caller owns the new array.
 */
export function windowSampleTimes(
  start: number,
  end: number,
  sampleRate: number,
): number[] {
  if (start === end && Math.abs(start) < Infinity) return [start];
  const span: number = end - start;
  const frames: number = Math.ceil(
    span < Infinity
      ? span * sampleRate
      : (end * 0.5 - start * 0.5) * sampleRate * 2,
  );
  // The 32-bit array length needs room for the start as well as every frame.
  if (!(start < end && sampleRate > 0 && frames < 2 ** 32 - 1))
    throw new RangeError("The sample window must fit an ordered seconds grid.");

  const times: number[] = [start];
  let prior: number = start;
  for (let index: number = 1; index < frames; ++index) {
    const offset: number = index / sampleRate;
    const time: number =
      offset < Infinity
        ? start + offset
        : (start * 0.5 + (index * 0.5) / sampleRate) * 2;
    if (time >= end) break;
    if (time > prior) {
      times.push(time);
      prior = time;
    }
  }
  times.push(end);
  return times;
}
