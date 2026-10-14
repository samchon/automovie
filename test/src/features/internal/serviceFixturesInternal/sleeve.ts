import type { IAutoMovieServicePenetration } from "@automovie/interface";

/** Return a fresh sealed cored-hole record, with caller overrides applied last. */
export function sleeve(
  overrides: Partial<IAutoMovieServicePenetration> = {},
): IAutoMovieServicePenetration {
  return {
    id: "sleeve",
    boundary: "bath-hall",
    opening: null,
    position: { x: 4, y: 1, z: 1 },
    radius: 0.1,
    sealed: true,
    ...overrides,
  };
}
