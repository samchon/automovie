import type { IAutoMovieServiceSegment } from "@automovie/interface";

/** Return a fresh two-point cold-water run citing no sleeve; overrides stay borrowed. */
export function segment(
  overrides: Partial<IAutoMovieServiceSegment> = {},
): IAutoMovieServiceSegment {
  return {
    id: "run",
    system: "cold",
    from: "cold-main-out",
    to: "basin-cold",
    route: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    ],
    radius: 0.02,
    section: 0.002,
    penetrations: [],
    ...overrides,
  };
}
