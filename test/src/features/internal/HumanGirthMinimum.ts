/**
 * Least girth among sampled sections and the exact tape section being checked.
 * Stations and girths are millimetres. Including that tape preserves its
 * membership in the search even when a one-millimetre grid misses its station.
 */
export function HumanGirthMinimum(
  tape: { station: number; girth: number },
  samples: Iterable<{ station: number; girth: number }>,
): { station: number; girth: number } {
  let least: { station: number; girth: number } = tape;
  for (const sample of samples)
    if (sample.girth < least.girth) least = sample;
  return least;
}
