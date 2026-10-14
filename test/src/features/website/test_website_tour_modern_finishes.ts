import { modernMesh } from "@automovie/website/modern-scene";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { modernItem } from "../internal/websiteTourFixture";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * Native mesh finishes retain world placement, UVs, tint and physical glass.
 * Scenarios:
 * 1. An untextured opaque part retains its emitted colour and shadow flags.
 * 2. A texture uses white modulation unless the producer requests tint.
 * 3. Blended physical glass preserves opacity, transmission, index and thickness.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the website's native mesh alias and observes world placement, shadow flags, plain/textured color modulation, UV/map binding and physical glass fields/defaults; dropped source placement, wrong tint or lost transparency/transmission parameters fail.
 * @evidence contracts/testing.md#independent-expectations The authored triangle, placement, color and later material-field edits determine expected copies, while documented uploader fallback roughness/metalness/opacity and glass defaults determine absent-field expectations; the existing predicate compares numeric leaves with zero-tolerance nclose and preserves exact booleans, color codes and structure.
 * @evidence contracts/testing.md#distinguishing-cases Covers opaque untextured, textured untinted, textured tinted glass, absent glass index/thickness and zero transmission; it checks UV presence and map identity without asserting UV component values or rendered material appearance.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_website_tour_modern_finishes entry reaches the shared native uploader through the actual website seam using CPU geometry/material/texture objects; no renderer, browser, image decoder or GPU runs.
 */
export function test_website_tour_modern_finishes(): void {
  const item: ReturnType<typeof modernItem> = modernItem(),
    textures: Map<string, THREE.Texture> = new Map<string, THREE.Texture>();
  const plain: ReturnType<typeof modernMesh> = modernMesh(item, textures);
  const material: THREE.MeshStandardMaterial = plain.material as THREE.MeshStandardMaterial;
  TestValidator.predicate(
    "world position and flags",
    test12ValuesClose([plain.position.toArray(), plain.castShadow, plain.receiveShadow],
    [[2, 3, 4], true, false]),
  );
  TestValidator.predicate(
    "fallback finish",
    test12ValuesClose([
      material.color.getHex(),
      material.roughness,
      material.metalness,
      material.opacity,
      material.side,
    ],
    [0x803020, 0.8, 0, 1, THREE.FrontSide]),
  );
  item.texture = "/textures/finish.png";
  item.uvs = [0, 0, 1, 0, 0, 1];
  const texture: THREE.Texture = new THREE.Texture();
  textures.set(item.texture, texture);
  const mapped: ReturnType<typeof modernMesh> = modernMesh(item, textures);
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
  const glass: ReturnType<typeof modernMesh> = modernMesh(item, textures),
    physical: THREE.MeshPhysicalMaterial = glass.material as THREE.MeshPhysicalMaterial;
  TestValidator.predicate(
    "native glass",
    test12ValuesClose([
      physical.color.getHex(),
      physical.opacity,
      physical.transparent,
      physical.depthWrite,
      physical.side,
      physical.transmission,
      physical.ior,
      physical.thickness,
    ],
    [0x803020, 0.4, true, false, THREE.DoubleSide, 0.8, 1.4, 0.02]),
  );
  delete item.ior;
  delete item.thickness;
  const defaults: THREE.MeshPhysicalMaterial = modernMesh(item, textures)
    .material as THREE.MeshPhysicalMaterial;
  TestValidator.predicate(
    "glass defaults",
    test12ValuesClose([defaults.ior, defaults.thickness],
    [1.5, 0]),
  );
  item.transmission = 0;
  item.opacity = 1;
  const opaque: ReturnType<typeof modernMesh> = modernMesh(item, textures);
  TestValidator.predicate(
    "zero transmission stays standard",
    opaque.material instanceof THREE.MeshStandardMaterial &&
      !(opaque.material instanceof THREE.MeshPhysicalMaterial),
  );
}
