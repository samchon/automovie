import { loadTourScene } from "@automovie/website/tour-scene";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { tourData } from "../internal/websiteTourFixture";
import { tourSceneFixture } from "../internal/websiteTourSceneFixture";

/**
 * The future uploader keeps its native embedded textures and stable daylight rig.
 * Scenarios:
 * 1. The opaque native payload is handed to its original uploader without file requests.
 * 2. Native sky radiance and preview shadow settings survive mounting and disposal.
 */
export const test_website_tour_future_scene = async (): Promise<void> => {
  const f = tourSceneFixture(),
    data = tourData();
  data.building = "future";
  let native: unknown;
  f.dependencies.uploadHouse = (payload) => {
    native = payload;
    return f.root;
  };
  const loaded = await loadTourScene(
    data,
    f.renderer,
    "https://example.org/site/buildings/future/",
    f.dependencies,
  );
  TestValidator.predicate(
    "original payload reaches native uploader",
    native === data.native && f.urls.length === 0,
  );
  TestValidator.predicate(
    "native daylight mounted",
    loaded.scene.background === f.sky && loaded.scene.children.includes(f.root),
  );
  const sun = loaded.scene.children.find(
    (o) => o instanceof THREE.DirectionalLight,
  ) as THREE.DirectionalLight;
  TestValidator.equals(
    "native key",
    [sun.position.toArray(), sun.intensity, sun.shadow.mapSize.toArray()],
    [[-12, 18, -8], 3, [4096, 4096]],
  );
  TestValidator.equals(
    "native shadow filter",
    f.renderer.shadowMap.type,
    THREE.PCFSoftShadowMap,
  );
  loaded.dispose();
  TestValidator.equals("environment target released", f.extraDisposed(), 1);
};
