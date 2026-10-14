import type { IAutoMovieServiceSystem } from "@automovie/interface";

/** Return a fresh cold-water supply record, with caller overrides applied last. */
export function system(overrides: Partial<IAutoMovieServiceSystem> = {}): IAutoMovieServiceSystem {
  return {
    id: "cold",
    discipline: "plumbing",
    medium: "cold-water",
    unit: "cubic-meter-per-second",
    flow: "from-root",
    root: "cold-main",
    capacity: 0.01,
    ...overrides,
  };
}
