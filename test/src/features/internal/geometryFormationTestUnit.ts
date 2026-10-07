import { IAutoMovieFormationDesign } from "@automovie/interface";
import { geometryFormationTestGroundAt as groundAt } from "./geometryFormationTestGroundAt";


/**
 * Two ranks of three, two metres between files and three between ranks, with
 * slot 1 promoted to a banner. Staged on its own ground at the anchor.
 */
export const geometryFormationTestUnit = (
  overrides: Partial<IAutoMovieFormationDesign> = {},
): IAutoMovieFormationDesign => ({
  id: "unit",
  modelRecipe: "member",
  count: 6,
  layout: {
    kind: "line",
    files: 3,
    ranks: 2,
    spacing: { lateral: 2, depth: 3 },
  },
  anchor: { x: 0, y: groundAt(0), z: 0 },
  facingDeg: 0,
  seed: 1,
  capabilities: [],
  heroOverrides: [{ slot: 1, actor: "banner" }],
  ...overrides,
});
