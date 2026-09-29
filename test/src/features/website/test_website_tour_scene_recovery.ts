import { loadTourScene } from "@automovie/website/tour-scene";
import { TestValidator } from "@nestia/e2e";

import { tourData } from "../internal/websiteTourFixture";
import { tourSceneFixture } from "../internal/websiteTourSceneFixture";

/**
 * A failed native upload releases textures and environment resources acquired
 * earlier in the attempt; the original failure remains the host's report.
 * Scenarios:
 * 1. A temple upload failure releases its loaded image and native sky.
 * 2. A future upload failure releases its offscreen daylight environment.
 */
export const test_website_tour_scene_recovery = async (): Promise<void> => {
  const f = tourSceneFixture(),
    data = tourData();
  data.native = {
    models: [
      { materials: [{ id: "stone", baseColorTexture: "textures/stone.png" }] },
    ],
  };
  let imagesDisposed = 0,
    skyDisposed = 0;
  const load = f.dependencies.load;
  f.dependencies.load = async (url) => {
    const texture = await load(url);
    texture.addEventListener("dispose", () => imagesDisposed++);
    return texture;
  };
  f.sky.addEventListener("dispose", () => skyDisposed++);
  f.dependencies.uploadTemple = () => {
    throw new Error("invalid temple mesh");
  };
  await TestValidator.error("native failure retained", () =>
    loadTourScene(data, f.renderer, "https://example.org/", f.dependencies),
  );
  TestValidator.equals(
    "partial temple resources released",
    [imagesDisposed, skyDisposed],
    [1, 1],
  );
  data.building = "future";
  f.dependencies.uploadHouse = () => {
    throw new Error("invalid house mesh");
  };
  await TestValidator.error("future failure retained", () =>
    loadTourScene(data, f.renderer, "https://example.org/", f.dependencies),
  );
  TestValidator.equals(
    "partial future environment released",
    f.extraDisposed(),
    1,
  );
};
