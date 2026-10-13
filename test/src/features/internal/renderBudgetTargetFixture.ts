import { sealAutoMovieRenderTarget } from "@automovie/engine";

/** Seal the fixed renderer and raster settings used by budget scenarios. */
export const renderBudgetTargetFixture = () => sealAutoMovieRenderTarget({
    renderer: { api: "webgl2", vendor: "test", device: "swiftshader" },
    settings: {
      width: 1280,
      height: 720,
      pixelRatio: 1,
      shadows: true,
      shadowType: "pcfSoft",
      toneMapping: "acesFilmic",
      exposure: 1,
    },
    assets: [
      { path: "textures/stone.png", digest: `sha256:${"a".repeat(64)}` },
    ],
  });
