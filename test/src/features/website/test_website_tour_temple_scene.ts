import { loadTourScene, textureUrl } from "@automovie/website/tour-scene";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { throwsError } from "../internal/predicates";
import { tourData } from "../internal/websiteTourFixture";
import { tourSceneFixture } from "../internal/websiteTourSceneFixture";

/**
 * Native temple images keep their declared transforms beneath any site mount.
 * Scenarios:
 * 1. Bound, unbound, transformed and plain texture references receive their own samplers.
 * 2. Scene teardown releases geometries, material arrays, depth maps and sky resources.
 * 3. Traversal or external texture addresses refuse resolution.
 */
export const test_website_tour_temple_scene = async (): Promise<void> => {
  const f = tourSceneFixture(),
    data = tourData();
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
  const loaded = await loadTourScene(
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
  TestValidator.equals(
    "authored transform",
    [f.textures[1]!.offset.toArray(), f.textures[1]!.repeat.toArray()],
    [
      [0.2, 0.3],
      [2, 3],
    ],
  );
  TestValidator.predicate(
    "rotation converted to radians",
    Math.abs(f.textures[1]!.rotation - Math.PI / 2) < 1e-12,
  );
  TestValidator.predicate(
    "native root and lighting",
    loaded.scene.children.includes(f.root) &&
      loaded.scene.environment === f.sky &&
      f.renderer.shadowMap.type === THREE.PCFShadowMap,
  );
  let geometryDisposed = 0,
    textureDisposed = 0;
  f.mesh.geometry.addEventListener("dispose", () => geometryDisposed++);
  f.textures[0]!.addEventListener("dispose", () => textureDisposed++);
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
      throwsError(() => textureUrl(invalid, "https://example.org/")),
    );
};
