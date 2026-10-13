import { IAutoMovieTransform } from "@automovie/interface";

/** Build the identity transform used by ad hoc resource-budget scene nodes. */
export const renderBudgetPoseFixture = (): IAutoMovieTransform => ({
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});
