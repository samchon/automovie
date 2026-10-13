import { measureAutoMovieTextureStorage } from "@automovie/engine";
import { AutoMovieTextureCache, buildLight, buildMaterial, readAutoMovieMaterialTextureSources } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

import { material } from "../internal/renderFixtures";

/**
 * Actual shader factories expose their own cached Texture objects to the
 * existing runtime fact lane. Metadata observation changes neither shader nor
 * texture lifetime, and its caller retains rows for this same context.
 *
 * Scenarios:
 *
 * 1. Two SSS materials share the real64-by-32 R-half table; replacing the
 *    current scene retains4096bytes and removes its current consumer label.
 * 2. A decoded normal overlay without a base normal exposes its real one-texel
 *    fallback, while ordinary and untextured meshes add no lookup.
 * 3. Actual rectangular-light initialization yields the native float pair or
 *    half pair according to the declared capability facts, without fake GL.
 */
export const test_viewer_material_texture_facts = async (): Promise<void> => {
  const THREE = await import("three");
  const scene = new THREE.Scene();
  const geometry = new THREE.BoxGeometry();
  const sss = buildMaterial({ ...material("sss"), subsurfaceRadius: { r: 0, g: 0, b: 0 } });
  const another = buildMaterial({ ...material("another"), subsurfaceRadius: { r: 0.01, g: 0.02, b: 0.03 } });
  scene.add(new THREE.Mesh(geometry, sss), new THREE.Mesh(geometry, another));
  const host = (float: boolean) => ({ extensions: { has: (_name: string) => float } });
  const read = (current = scene, retained: ReturnType<typeof readAutoMovieMaterialTextureSources> = [], float = true) =>
    readAutoMovieMaterialTextureSources({ scope: "scope", renderer: host(float), scene: current, retained });
  const first = read();
  TestValidator.predicate("same actual lookup cache object", sss.userData.autoMovieSubsurfaceTexture === another.userData.autoMovieSubsurfaceTexture);
  TestValidator.equals("shared half lookup facts", first.map((row) => [row.purpose, row.texture.width, row.texture.height, row.texture.format, row.residents]),
    [["subsurface-lut", 64, 32, "r16f", ["scope"]]]);
  TestValidator.equals("same allocation on repeat observation", read(scene, first).length, 1);
  const multipleScopes = first.map((row) => ({ ...row, residents: ["other", "scope"] }));
  TestValidator.equals("current use preserves other live scope", read(scene, multipleScopes)[0].residents, ["other", "scope"]);
  const empty = new THREE.Scene();
  TestValidator.equals("material removal retains context facts", read(empty, first).map((row) => [row.texture.width, row.texture.height, row.residents]), [[64, 32, []]]);
  TestValidator.equals("scope replacement removes only its own use", read(empty, multipleScopes)[0].residents, ["other"]);
  TestValidator.equals("host cleared facts after release", read(empty), []);
  const cache = new AutoMovieTextureCache(async () => new THREE.DataTexture(new Uint8Array(64), 4, 4));
  await cache.prime(["color", "normal"]);
  const overlay = buildMaterial({ ...material("overlay"), overlays: [{ baseColorTexture: "color", normalTexture: "normal", blend: "multiply", strength: 1 }] }, cache.resolve);
  scene.add(new THREE.Mesh(geometry, overlay));
  const flat = read().find((row) => row.purpose === "overlay-flat-normal")!;
  TestValidator.equals("actual one-texel fallback", [flat.texture.width, flat.texture.height, flat.texture.format], [1, 1, "rgba8"]);
  TestValidator.predicate("actual fallback supplies its normal slot", overlay.normalMap === overlay.userData.autoMovieOverlayFlatNormal);
  scene.add(new THREE.Mesh(geometry, buildMaterial(material("ordinary"))), new THREE.Group());
  TestValidator.equals("ordinary objects add no lookup", read().length, 2);
  const unsupported = new THREE.MeshBasicMaterial();
  const invalidScene = new THREE.Scene();
  invalidScene.add(new THREE.Mesh(geometry, unsupported));
  for (const value of [null, 7, {}, { isMaterial: false }])
    invalidScene.add(Object.assign(new THREE.Object3D(), { material: value }));
  for (const value of [null, 7, {}, { isTexture: false }]) {
    unsupported.userData.autoMovieSubsurfaceTexture = value;
    TestValidator.equals("invalid producer metadata yields no invented lookup", read(invalidScene), []);
  }
  const materialArray = Object.assign(new THREE.Object3D(), { material: [sss, another] });
  invalidScene.add(materialArray);
  TestValidator.equals("material arrays preserve actual sharing", read(invalidScene).length, 1);
  const area = buildLight({ id: "area", type: "area", width: 1, height: 1, castShadow: false,
    color: { r: 1, g: 1, b: 1, a: 1, hex: null }, intensity: 1,
    transform: { translation: { x: 0, y: 0, z: 2 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } },
  });
  scene.add(area);
  invalidScene.remove(materialArray);
  invalidScene.add(area);
  TestValidator.equals("area light without PBR uploads no lookup", read(invalidScene), []);
  scene.add(area);
  for (const [float, format, width] of [[true, "rgba32f", 16], [false, "rgba16f", 8]] as const) {
    const pair = read(scene, [], float).filter((row) => row.purpose === "area-ltc-1" || row.purpose === "area-ltc-2");
    TestValidator.equals("actual chosen LTC pair", pair.map((row) => [row.texture.width, row.texture.height, row.texture.format]), [[64, 64, format], [64, 64, format]]);
    TestValidator.equals("independent LTC component arithmetic", pair.reduce((sum, row) => sum + measureAutoMovieTextureStorage({ ...row.texture, bytesPerTexel: width })!, 0), 2 * 64 * 64 * width);
  }
  geometry.dispose(); sss.dispose(); another.dispose(); overlay.dispose(); unsupported.dispose();
  await cache.dispose();
};
