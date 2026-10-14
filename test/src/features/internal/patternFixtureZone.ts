import type { IAutoMovieSurfacePatternZone } from "@automovie/engine";

import { patternFixtureRectangle } from "./patternFixtureRectangle";
import { patternFixtureStackBond } from "./patternFixtureStackBond";

/**
 * Author a two-by-one metre field with half-metre square lattice modules.
 *
 * Region, origin, pitch, reach and material are fixed baseline inputs, with overrides applied last so each consumer changes the branch it owns. The rectangle and generator are authored fixtures rather than copies of a generated layout; assertion ownership stays with each discoverable pattern unit. Calls create fresh baseline records and a callback, borrow overriding objects and acquire no external resource.
 */
export function patternFixtureZone(
  overrides: Partial<IAutoMovieSurfacePatternZone> = {},
): IAutoMovieSurfacePatternZone {
  return {
    id: "field",
    region: patternFixtureRectangle(0, 0, 2, 1),
    origin: { u: 0, v: 0 },
    period: { u: 0.5, v: 0.5 },
    reach: { u: 0.5, v: 0.5 },
    material: "tile-surface",
    generate: patternFixtureStackBond(0.5),
    ...overrides,
  };
}
