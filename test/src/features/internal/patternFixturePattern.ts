import type { IAutoMovieSurfacePattern } from "@automovie/engine";

import { patternFixtureZone } from "./patternFixtureZone";

/**
 * Author the original single-zone pattern with zero joint and adjacency.
 *
 * Minimum coverage one quarter, null grain tolerance, seed seven and one variant are input premises; overrides are applied last and may intentionally violate admission. Existing pattern units independently calculate tiling, findings and transforms, while this builder performs no validation or layout. Each call owns its baseline wrapper, zone and arrays, borrows overrides and starts no host or dynamically registered case.
 */
export function patternFixturePattern(
  overrides: Partial<IAutoMovieSurfacePattern> = {},
): IAutoMovieSurfacePattern {
  return {
    id: "floor",
    zones: [patternFixtureZone()],
    exclusions: [],
    joint: 0,
    jointTolerance: 0,
    adjacency: 0,
    minimumPiece: 0.25,
    grainToleranceDeg: null,
    seed: 7,
    variants: 1,
    ...overrides,
  };
}
