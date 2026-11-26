import { AutoMovieEngineRenderTarget } from "@automovie/engine";
import type { IAutoMovieRenderTarget } from "@automovie/interface";

/** Seal the fixed renderer and raster settings used by budget scenarios. */
export const simulatedRenderTargetFixture: () => IAutoMovieRenderTarget =
  (): IAutoMovieRenderTarget =>
    AutoMovieEngineRenderTarget.sealAutoMovieRenderTarget({
      renderer: { api: "webgl2", vendor: "test", device: "swiftshader" },
      settings: {
        width: 640,
        height: 360,
        pixelRatio: 1,
        shadows: false,
        shadowType: "none",
        toneMapping: "acesFilmic",
        exposure: 1,
      },
      assets: [],
    });
