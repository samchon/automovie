import type { IAutoMovieWaterFeature } from "@automovie/interface";

/** Build the original atrium pond binding to the basin/coping identities, then shallowly apply overrides. Lists and nested values supplied by overrides remain borrowed; validation and rendered adoption belong to the owning cases. */
export const waterFeature: (
  overrides?: Partial<IAutoMovieWaterFeature>,
) => IAutoMovieWaterFeature = (
  overrides: Partial<IAutoMovieWaterFeature> = {},
): IAutoMovieWaterFeature => ({
  id: "atrium-pond",
  environment: "atrium",
  space: "atrium-basin",
  domain: "basin",
  kind: "pond",
  mode: "simulated",
  boundaries: ["coping"],
  material: null,
  ...overrides,
});
