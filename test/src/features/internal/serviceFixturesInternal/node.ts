import type { IAutoMovieServiceNode } from "@automovie/interface";

/** Return a fresh bare bath junction, borrowing any caller override values. */
export function node(overrides: Partial<IAutoMovieServiceNode> = {}): IAutoMovieServiceNode {
  return {
    id: "junction",
    kind: "junction",
    space: "bath",
    element: null,
    position: { x: 0, y: 0, z: 0 },
    ports: [],
    state: null,
    maintenance: null,
    ...overrides,
  };
}
