import type { IAutoMovieRenderTextureTarget } from "@automovie/engine";

/** Declare the fixed fixture sun's native 512-pixel PCF color/depth attachments. */
export const renderShadowTargetFixture = (): IAutoMovieRenderTextureTarget => ({
  owner: "fixture-sun-map", shadow: { scope: "current", light: "sun", role: "map" },
  width: 512, height: 512, formats: ["rgba8"], mipmapped: false,
  samples: 0, depthBytesPerTexel: 4, depthTexture: true,
});
