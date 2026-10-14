import { loadTourScene } from "@automovie/website/tour-scene";
import { TestValidator } from "@nestia/e2e";
import type * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";

import { test12ValuesClose } from "../internal/test12ValuesClose";
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
 *
 * @evidence contracts/testing.md#behavioral-verification Awaits modern tour loading, observing one load for a shared texture path, capability-limited anisotropy, authored exposure, a reflector target disposal event and propagated image rejection; redundant image decoding or skipped target cleanup fails.
 * @evidence contracts/testing.md#independent-expectations Two authored items cite one texture path, the supplied renderer reports anisotropy four, and payload exposure is independently set to 1.25; disposal listeners count attempts on the returned target, and an authored Error supplies the rejection identity independently of the loader.
 * @evidence contracts/testing.md#distinguishing-cases Covers repeated native image identity, ordinary plus mirror items, successful teardown and failed image loading; missing physical lighting, material projection and cleanup failures have separate units.
 * @evidence contracts/testing.md#execution-ownership The async test_website_tour_modern_scene entry owns awaited loading through existing supplied texture/daylight/upload callbacks with CPU Three resources; no network, browser or WebGL renderer runs, and a dispose event does not establish GPU release.
 */
export async function test_website_tour_modern_scene(): Promise<void> {
  const f: ReturnType<typeof tourSceneFixture> = tourSceneFixture(),
    data: ReturnType<typeof tourData> = tourData(),
    payload: ReturnType<typeof modernPayload> = modernPayload();
  data.building = "modern";
  data.native = payload;
  const item: ReturnType<typeof modernItem> = modernItem();
  item.texture = "/textures/oak.png";
  item.uvs = [0, 0, 1, 0, 0, 1];
  payload.items = [
    item,
    { ...item, id: "other" },
    { ...modernItem(), id: "mirror", faceId: "mirror" },
  ];
  payload.physicalLighting!.environment.exposure = 1.25;
  const loaded: Awaited<ReturnType<typeof loadTourScene>> = await loadTourScene(
    data,
    f.renderer,
    "https://example.org/mounted/buildings/modern/",
    f.dependencies,
  );
  TestValidator.equals("image loaded once", f.urls, [
    "https://example.org/mounted/buildings/modern/textures/oak.png",
  ]);
  TestValidator.predicate(
    "supported anisotropy and exposure",
    test12ValuesClose(
      [f.textures[0]!.anisotropy, f.renderer.toneMappingExposure],
      [4, 1.25],
    ),
  );
  const mirror: Reflector = loaded.scene.children.find(
    (o: THREE.Object3D): boolean => o instanceof Reflector,
  ) as Reflector;
  let targetDisposed: number = 0;
  mirror.getRenderTarget().addEventListener("dispose", (): void => {
    targetDisposed++;
  });
  loaded.dispose();
  TestValidator.equals("mirror target released", targetDisposed, 1);
  const imageFailure: Error = new Error("missing image");
  f.dependencies.load = async (): Promise<THREE.Texture> => {
    throw imageFailure;
  };
  let observedFailure: unknown;
  try {
    await loadTourScene(
      data,
      f.renderer,
      "https://example.org/",
      f.dependencies,
    );
  } catch (error) {
    observedFailure = error;
  }
  TestValidator.predicate(
    "decode failure reaches host",
    observedFailure === imageFailure,
  );
}
