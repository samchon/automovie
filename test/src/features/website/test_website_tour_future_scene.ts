import { loadTourScene } from "@automovie/website/tour-scene";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { tourData } from "../internal/websiteTourFixture";
import { tourSceneFixture } from "../internal/websiteTourSceneFixture";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * The future route forwards its native payload and selects its preview daylight rig.
 * Scenarios:
 * 1. The opaque native payload is handed to its original uploader without file requests.
 * 2. Supplied sky identity and preview shadow settings survive mounting and disposal.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls loadTourScene through supplied upload/daylight ports, observing original payload identity, no image requests, mounted root/sky, future-route light settings and supplemental disposal count; substituted payloads, wrong route lighting or omitted cleanup fails.
 * @evidence contracts/testing.md#independent-expectations The authored future-route preview contract fixes key position/intensity and shadow-map dimensions, while fixture identities independently establish uploaded payload/root/sky ownership; exact numeric records use zero-tolerance nclose through the existing structural predicate, and cleanup counts show callback attempts rather than GPU release.
 * @evidence contracts/testing.md#distinguishing-cases Covers the future branch with opaque payload and no external texture requests plus final cleanup; temple/modern texture decoding and loading/cleanup failures have separate scene units.
 * @evidence contracts/testing.md#execution-ownership The async test_website_tour_future_scene entry owns the awaited adapter call through existing owned dependency ports and resident Three resources; it starts no browser, renderer, fetch or GPU and does not prove native visual daylight.
 */
export async function test_website_tour_future_scene(): Promise<void> {
  const f: ReturnType<typeof tourSceneFixture> = tourSceneFixture(),
    data: ReturnType<typeof tourData> = tourData();
  data.building = "future";
  let native: unknown;
  f.dependencies.uploadHouse = (payload: unknown): THREE.Group => {
    native = payload;
    return f.root;
  };
  const loaded: Awaited<ReturnType<typeof loadTourScene>> = await loadTourScene(
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
  const sun: THREE.DirectionalLight = loaded.scene.children.find(
    (o: THREE.Object3D): boolean => o instanceof THREE.DirectionalLight,
  ) as THREE.DirectionalLight;
  TestValidator.predicate(
    "native key",
    test12ValuesClose([sun.position.toArray(), sun.intensity, sun.shadow.mapSize.toArray()],
    [[-12, 18, -8], 3, [4096, 4096]]),
  );
  TestValidator.equals(
    "native shadow filter",
    f.renderer.shadowMap.type,
    THREE.PCFSoftShadowMap,
  );
  loaded.dispose();
  TestValidator.equals("environment target released", f.extraDisposed(), 1);
}
