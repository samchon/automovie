import type { IAutoMovieInstanceSetPlacement } from "@automovie/engine";

const COUNT: number = 2_000;

/**
 * Supply the existing two-thousand-member arrangement for instance variation units.
 *
 * The original grid, seed, scalar range, palette and trait are returned with caller overrides applied last; callers exercise the real member regenerator and compiled instance owner.
 *
 * Literal ranges, authored weights and rotation laws in the units define their expectations independently; this helper supplies inputs and no predicted generated member.
 *
 * Overrides preserve the current weighted tables, explicit/lattice layouts, fixed-size twins, enhanced output fields and probability omission/endpoints without selecting cases or adding a fixture.
 *
 * Each invocation allocates a mutable placement for its portable caller, retains no result, starts no host and installs no replacement method.
 */
export const createInstanceVariationPlacement: (
  overrides?: Partial<IAutoMovieInstanceSetPlacement>,
) => IAutoMovieInstanceSetPlacement = (
  overrides: Partial<IAutoMovieInstanceSetPlacement> = {},
): IAutoMovieInstanceSetPlacement => ({
  id: "crowd",
  count: COUNT,
  model: "body",
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
