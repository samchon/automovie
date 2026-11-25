/**
 * The longest step that has the stepping plan cover a way in a given count of
 * steps, metres. The plan takes the fewest steps whose cruising step, the way
 * over the count less the steps its ramps cost, is no longer than the longest
 * (`WalkPace.fit`), and times each at the longest step over the speed; the way
 * over the count less half a step lies in the middle of the longest steps that
 * give the count, so the count holds while the ramps cost less than half a
 * step.
 */
export function HumanGaitCounted(way: number, count: number): number {
  return way / (count - 0.5);
}
