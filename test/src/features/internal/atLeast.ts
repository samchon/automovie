/** Check each visited numeric array element against the supplied inclusive lower bound. Empty arrays pass and sparse slots are skipped by Array.every; owning cases must independently establish dense populations and their expected bound. */
export const atLeast: (values: readonly number[], bound: number) => boolean = (
  values: readonly number[],
  bound: number,
): boolean => values.every((value: number): boolean => value >= bound);
