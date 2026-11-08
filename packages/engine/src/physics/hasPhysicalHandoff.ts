import type { IAutoMoviePhysicalHandoff } from "./IAutoMoviePhysicalHandoff";

/** Inspect run-owned transitions without allocating a key array on each native tick. */
export function hasPhysicalHandoff(
  transitions: Readonly<Record<string, IAutoMoviePhysicalHandoff>> | undefined,
): boolean {
  if (!transitions) return false;
  for (const bone in transitions)
    if (Object.hasOwn(transitions, bone)) return true;
  return false;
}
