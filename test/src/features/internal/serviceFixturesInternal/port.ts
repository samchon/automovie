import type { IAutoMovieServicePort } from "@automovie/interface";

/** Return a fresh demand-free cold-water inlet, with overrides applied last. */
export function port(
  overrides: Partial<IAutoMovieServicePort> = {},
): IAutoMovieServicePort {
  return {
    id: "port",
    system: "cold",
    medium: "cold-water",
    direction: "in",
    unit: "cubic-meter-per-second",
    demand: 0,
    section: null,
    position: { x: 0, y: 0, z: 0 },
    ...overrides,
  };
}
