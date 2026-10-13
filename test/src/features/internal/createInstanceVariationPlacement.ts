import type { IAutoMovieInstanceSetPlacement } from "@automovie/engine";

const COUNT = 2_000;

/** Two thousand members in a 40 by 50 grid with ranged scale and one trait. */
export const createInstanceVariationPlacement = (
  overrides: Partial<IAutoMovieInstanceSetPlacement> = {},
): IAutoMovieInstanceSetPlacement => ({
  id: "crowd",
  count: COUNT,
  modelRecipe: "body",
  layout: { kind: "grid", rows: 50, columns: 40, spacing: { x: 1, z: 1 } },
  route: null,
  anchor: { x: 0, y: 0, z: 0 },
  facingDeg: 0,
  seed: 12_345,
  variation: {
    scale: { min: 0.5, max: 1.5 },
    palette: ["#111111", "#222222", "#333333"],
    traits: [{ name: "lean", min: -1, max: 1 }],
  },
  ...overrides,
});

