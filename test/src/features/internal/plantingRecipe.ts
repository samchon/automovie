import type { IAutoMoviePlantingDomain } from "@automovie/interface";

/** Build the original no-jitter seeded fern recipe with dyadic lengths/radii and declared branch/leaf budgets. Overrides replace fields shallowly and may enable jitter; direction normalization and later growth need not remain dyadic, and this builder does not prove rendered shape or platform identity. */
export const plantingRecipe: (overrides?: Partial<IAutoMoviePlantingDomain>) => IAutoMoviePlantingDomain = (
  overrides: Partial<IAutoMoviePlantingDomain> = {},
): IAutoMoviePlantingDomain => ({
  version: 1,
  id: "fern",
  units: "meter",
  seed: 20_260_810,
  structure: {
    levels: 3,
    axis: { x: 0, y: 1, z: 0 },
    length: 1,
    radius: 0.0625,
    lengthRatio: 0.5,
    radiusRatio: 0.5,
    children: [
      { id: "a", direction: { x: 1, y: 1, z: 0 }, offset: 0.5 },
      { id: "b", direction: { x: -1, y: 1, z: 0 }, offset: 1 },
    ],
    directionJitter: 0,
    lengthJitter: 0,
    gravitropism: 0,
  },
  growth: { stage: 1, onset: 0.25 },
  pruning: { kind: "none" },
  foliage: null,
  budget: { maxBranches: 64, maxLeaves: 512 },
  ...overrides,
});
