import type {
  AutoMovieSurfacePatternGenerator,
  IAutoMoviePatternCandidate,
} from "@automovie/engine";

/**
 * Author one unturned square at each lattice origin plus half its side length.
 *
 * The callback names its piece from the supplied column and row, preserving the original cell order and grain value without reading laid output. Existing courses, findings, quantity, texture and refusal tests own their independent expected counts, areas and diagnostics. A fresh callback retains only size and grain, and each evaluation returns a fresh candidate; no generator registry, clock or renderer is involved.
 */
export function patternFixtureStackBond(
  size: number,
  grainDeg: number = 0,
): AutoMovieSurfacePatternGenerator {
  return ({
    column,
    row,
    origin,
  }: Parameters<AutoMovieSurfacePatternGenerator>[0]): IAutoMoviePatternCandidate[] => [
    {
      id: `t-${column}-${row}`,
      center: { u: origin.u + size / 2, v: origin.v + size / 2 },
      size: { u: size, v: size },
      rotationDeg: 0,
      grainDeg,
      mirror: false,
    },
  ];
}
