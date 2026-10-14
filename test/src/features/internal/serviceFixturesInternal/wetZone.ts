import type { IAutoMovieWetZone } from "@automovie/interface";

/** Return a fresh dry bath zone with no membrane, drains or thresholds unless overridden. */
export function wetZone(
  overrides: Partial<IAutoMovieWetZone> = {},
): IAutoMovieWetZone {
  return {
    id: "zone",
    space: "bath",
    grade: "dry",
    membrane: [],
    upturn: 0,
    slope: 0,
    drains: [],
    thresholds: [],
    ...overrides,
  };
}
