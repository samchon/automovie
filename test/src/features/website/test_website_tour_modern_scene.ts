import { loadTourScene } from "@automovie/website/tour-scene";
import { TestValidator } from "@nestia/e2e";
import { Reflector } from "three/addons/objects/Reflector.js";

import {
  modernItem,
  modernPayload,
  tourData,
} from "../internal/websiteTourFixture";
import { tourSceneFixture } from "../internal/websiteTourSceneFixture";

/**
 * Modern scene upload waits for deduplicated image resources and retains exposure.
 * Scenarios:
 * 1. Multiple items sharing one native image trigger one image load.
 * 2. Native mirrors release their offscreen render targets on teardown.
 * 3. An image failure propagates to the host instead of showing an incomplete tour.
 */
export const test_website_tour_modern_scene = async (): Promise<void> => {
  const f = tourSceneFixture(),
    data = tourData(),
    payload = modernPayload();
  data.building = "modern";
  data.native = payload;
  const item = modernItem();
  item.texture = "/textures/oak.png";
  item.uvs = [0, 0, 1, 0, 0, 1];
  payload.items = [
    item,
    { ...item, id: "other" },
    { ...modernItem(), id: "mirror", faceId: "mirror" },
  ];
  payload.physicalLighting!.environment.exposure = 1.25;
  const loaded = await loadTourScene(
    data,
    f.renderer,
    "https://example.org/mounted/buildings/modern/",
    f.dependencies,
  );
  TestValidator.equals("image loaded once", f.urls, [
    "https://example.org/mounted/buildings/modern/textures/oak.png",
  ]);
  TestValidator.equals(
    "supported anisotropy and exposure",
    [f.textures[0]!.anisotropy, f.renderer.toneMappingExposure],
    [4, 1.25],
  );
  const mirror = loaded.scene.children.find(
    (o) => o instanceof Reflector,
  ) as Reflector;
  let targetDisposed = 0;
  mirror.getRenderTarget().addEventListener("dispose", () => targetDisposed++);
  loaded.dispose();
  TestValidator.equals("mirror target released", targetDisposed, 1);
  f.dependencies.load = async () => {
    throw new Error("missing image");
  };
  await TestValidator.error("decode failure reaches host", () =>
    loadTourScene(data, f.renderer, "https://example.org/", f.dependencies),
  );
};
