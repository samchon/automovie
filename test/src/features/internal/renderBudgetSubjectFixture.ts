import { IAutoMovieRenderSubject } from "@automovie/engine";

import {
  buildingFixture,
  instanceSetFixture,
  modelsFixture,
  sceneFixture,
} from "./renderFixtures";
import { renderShadowTargetFixture } from "./renderShadowTargetFixture";

/** Build the composed render subject used by resource-budget scenarios. */
export const renderBudgetSubjectFixture = (): IAutoMovieRenderSubject => ({
  scene: sceneFixture(),
  models: modelsFixture(),
  environments: [buildingFixture()],
  instanceSets: [instanceSetFixture({ id: "windows", count: 12, chunks: 3 })],
  textureResidency: {
    owner: "current",
    residents: [],
    dfgRetained: false,
    pmremRetained: null,
    renderTargets: [renderShadowTargetFixture()],
  },
  textures: [
    {
      format: "rgba8" as const,
      asset: "textures/stone.png",
      width: 512,
      height: 512,
      mipmapped: true,
    },
  ],
});
