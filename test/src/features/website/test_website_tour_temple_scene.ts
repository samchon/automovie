import { loadTourScene, textureUrl } from "@automovie/website/tour-scene";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose, throwsError } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";
import { tourData } from "../internal/websiteTourFixture";
import { tourSceneFixture } from "../internal/websiteTourSceneFixture";

/**
 * Native temple images keep their declared transforms beneath any site mount.
 * Scenarios:
 * 1. Bound, unbound, transformed and plain texture references receive their own samplers.
 * 2. Scene teardown emits disposal events for the observed geometry and texture resources.
 * 3. Traversal or external texture addresses refuse resolution.
 *
 * @evidence contracts/testing.md#behavioral-verification Awaits temple loading and observes mount-relative image requests, independent texture sampler transforms, mounted root/environment, shadow filter and resource-disposal events; wrong URL rebasing, dropped sampler transforms or omitted cleanup fails.
 * @evidence contracts/testing.md#independent-expectations Authored binding paths and the supplied base URL determine expected destinations; offset/repeat literals and a 90-degree angle determine sampler values, and listeners count cleanup attempts on independently acquired resources without claiming native GPU release.
 * @evidence contracts/testing.md#distinguishing-cases Covers unbound, string, transformed and ordinary object texture bindings, leading-root rebasing and external/literal-parent/wrong-prefix refusals; encoded traversal admission is not asserted and upload/cleanup failure paths have separate units.
 * @evidence contracts/testing.md#execution-ownership The async test_website_tour_temple_scene entry owns awaited adapter calls through existing dependency ports and CPU Three disposal events, with no network, browser or renderer execution and no replaced foreign methods.
 */
export async function test_website_tour_temple_scene(): Promise<void> {
  const f: ReturnType<typeof tourSceneFixture> = tourSceneFixture(),
    data: ReturnType<typeof tourData> = tourData();
  data.native = {
    models: [
      {
        materials: [
          { id: "flat", baseColorTexture: null },
          { id: "plain", baseColorTexture: "textures/stone.png" },
          {
            id: "shifted",
            baseColorTexture: {
              asset: "textures/timber.png",
              transform: {
                offset: { x: 0.2, y: 0.3 },
                scale: { x: 2, y: 3 },
                rotationDeg: 90,
              },
            },
          },
          { id: "ordinary", baseColorTexture: { asset: "textures/tile.png" } },
        ],
      },
    ],
  };
  const loaded: Awaited<ReturnType<typeof loadTourScene>> = await loadTourScene(
    data,
    f.renderer,
    "https://example.org/mounted/buildings/ancient/",
    f.dependencies,
  );
  TestValidator.equals("mount-safe image paths", f.urls, [
    "https://example.org/mounted/buildings/ancient/textures/stone.png",
    "https://example.org/mounted/buildings/ancient/textures/timber.png",
    "https://example.org/mounted/buildings/ancient/textures/tile.png",
  ]);
  TestValidator.predicate(
    "authored transform",
    test12ValuesClose(
      [f.textures[1]!.offset.toArray(), f.textures[1]!.repeat.toArray()],
      [
        [0.2, 0.3],
        [2, 3],
      ],
    ),
  );
  TestValidator.predicate(
    "rotation converted to radians",
    nclose(f.textures[1]!.rotation, Math.PI / 2, 1e-12) &&
      Math.abs(f.textures[1]!.rotation - Math.PI / 2) < 1e-12,
  );
  TestValidator.predicate(
    "native root and lighting",
    loaded.scene.children.includes(f.root) &&
      loaded.scene.environment === f.sky &&
      f.renderer.shadowMap.type === THREE.PCFShadowMap,
  );
  let geometryDisposed: number = 0,
    textureDisposed: number = 0;
  f.mesh.geometry.addEventListener("dispose", (): void => {
    geometryDisposed++;
  });
  f.textures[0]!.addEventListener("dispose", (): void => {
    textureDisposed++;
  });
  loaded.dispose();
  TestValidator.equals(
    "owned resources released",
    [geometryDisposed, textureDisposed],
    [1, 1],
  );
  TestValidator.equals(
    "native absolute path rebased",
    textureUrl("/textures/a.png", "https://example.org/site/buildings/modern/"),
    "https://example.org/site/buildings/modern/textures/a.png",
  );
  for (const invalid of [
    "https://other.org/texture.png",
    "textures/../escape.png",
    "elsewhere/a.png",
  ])
    TestValidator.predicate(
      "invalid asset namespace",
      throwsError(
        (): string => textureUrl(invalid, "https://example.org/"),
        "Invalid production texture:",
      ),
    );
}
