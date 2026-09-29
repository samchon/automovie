import { modernMesh } from "@automovie/website/modern-scene";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { modernItem } from "../internal/websiteTourFixture";

/**
 * Native mesh finishes retain world placement, UVs, tint and physical glass.
 * Scenarios:
 * 1. An untextured opaque part retains its emitted colour and shadow flags.
 * 2. A texture uses white modulation unless the producer requests tint.
 * 3. Blended physical glass preserves opacity, transmission, index and thickness.
 */
export const test_website_tour_modern_finishes = (): void => {
  const item = modernItem(),
    textures = new Map<string, THREE.Texture>();
  const plain = modernMesh(item, textures);
  const material = plain.material as THREE.MeshStandardMaterial;
  TestValidator.equals(
    "world position and flags",
    [plain.position.toArray(), plain.castShadow, plain.receiveShadow],
    [[2, 3, 4], true, false],
  );
  TestValidator.equals(
    "fallback finish",
    [
      material.color.getHex(),
      material.roughness,
      material.metalness,
      material.opacity,
      material.side,
    ],
    [0x803020, 0.8, 0, 1, THREE.FrontSide],
  );
  item.texture = "/textures/finish.png";
  item.uvs = [0, 0, 1, 0, 0, 1];
  const texture = new THREE.Texture();
  textures.set(item.texture, texture);
  const mapped = modernMesh(item, textures);
  TestValidator.equals(
    "texture modulation",
    (mapped.material as THREE.MeshStandardMaterial).color.getHex(),
    0xffffff,
  );
  TestValidator.predicate(
    "native UVs and map",
    mapped.geometry.hasAttribute("uv") &&
      (mapped.material as THREE.MeshStandardMaterial).map === texture,
  );
  item.textureTint = true;
  item.opacity = 0.4;
  item.doubleSided = true;
  item.roughness = 0.2;
  item.metalness = 0.3;
  item.transmission = 0.8;
  item.ior = 1.4;
  item.thickness = 0.02;
  const glass = modernMesh(item, textures),
    physical = glass.material as THREE.MeshPhysicalMaterial;
  TestValidator.equals(
    "native glass",
    [
      physical.color.getHex(),
      physical.opacity,
      physical.transparent,
      physical.depthWrite,
      physical.side,
      physical.transmission,
      physical.ior,
      physical.thickness,
    ],
    [0x803020, 0.4, true, false, THREE.DoubleSide, 0.8, 1.4, 0.02],
  );
  delete item.ior;
  delete item.thickness;
  const defaults = modernMesh(item, textures)
    .material as THREE.MeshPhysicalMaterial;
  TestValidator.equals(
    "glass defaults",
    [defaults.ior, defaults.thickness],
    [1.5, 0],
  );
  item.transmission = 0;
  item.opacity = 1;
  TestValidator.predicate(
    "zero transmission stays standard",
    modernMesh(item, textures).material instanceof THREE.MeshStandardMaterial,
  );
};
