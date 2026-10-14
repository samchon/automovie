import type * as ThreeTypes from "three";
import { type AutoMovieBuiltinTexturePurpose, type IAutoMovieRenderTextureSource, measureAutoMovieTextureStorage } from "@automovie/engine";
import { AutoMovieTextureCache, buildLight, buildMaterial, readAutoMovieMaterialTextureSources } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

import { material } from "../internal/renderFixtures";

/**
 * Shader factories expose cached Texture objects through the existing metadata observer. The caller retains rows for its context; these facts do not establish native texture uploads or physical allocation.
 *
 * Scenarios:
 *
 * 1. Two SSS materials share a 64-by-32 R-half table; replacing the scene retains its 4096-byte metadata extent and removes the current consumer label.
 * 2. A normal overlay without a base normal exposes its one-texel fallback; ordinary and untextured meshes add no lookup.
 * 3. Rectangular-light initialization selects float or half lookup metadata from the supplied capability facts without starting GL.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds actual subsurface/overlay materials and a rectangular light, observes their published Texture objects and passes the rows through Engine storage arithmetic; catches lost shared identity, missing lookup dimensions and scope labels retained after removal.
 * @evidence contracts/testing.md#independent-expectations The installed producers' 64-by-32 half table, one RGBA8 texel and two 64-by-64 LTC tables define literal extents and component-byte arithmetic. The supplied extension-choice port checks selection only; public metadata does not prove native uploads, allocations or pixels.
 * @evidence contracts/testing.md#distinguishing-cases Covers shared and repeated lookup use, retained-only rows, multiple scopes, ordinary/invalid metadata, material arrays, area light without PBR and both LTC component formats; upload-key equivalence has its own adjacent test.
 * @evidence contracts/testing.md#execution-ownership This portable asynchronous entry uses actual CPU-side Three objects through product factories and a narrow supplied capability port, retires its local geometry/material/cache owners and launches no renderer, browser or process.
 */
export async function test_viewer_material_texture_facts(): Promise<void> {
  const THREE: typeof ThreeTypes = await import("three");
  const scene: ThreeTypes.Scene<ThreeTypes.Object3DEventMap> = new THREE.Scene();
  const geometry: ThreeTypes.BoxGeometry = new THREE.BoxGeometry();
  const sss: ThreeTypes.MeshPhysicalMaterial = buildMaterial({ ...material("sss"), subsurfaceRadius: { r: 0, g: 0, b: 0 } });
  const another: ThreeTypes.MeshPhysicalMaterial = buildMaterial({ ...material("another"), subsurfaceRadius: { r: 0.01, g: 0.02, b: 0.03 } });
  scene.add(new THREE.Mesh(geometry, sss), new THREE.Mesh(geometry, another));
  const host: (float: boolean) => { extensions: { has: (_name: string) => boolean; }; } = (float: boolean): { extensions: { has: (_name: string) => boolean; }; } => ({ extensions: { has: (_name: string): boolean => float } });
  const read: (current?: ThreeTypes.Scene<ThreeTypes.Object3DEventMap>, retained?: ReturnType<typeof readAutoMovieMaterialTextureSources>, float?: boolean) => { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }[] = (current: ThreeTypes.Scene<ThreeTypes.Object3DEventMap> = scene, retained: ReturnType<typeof readAutoMovieMaterialTextureSources> = [], float: boolean = true): { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }[] =>
    readAutoMovieMaterialTextureSources({ scope: "scope", renderer: host(float), scene: current, retained });
  const first: { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }[] = read();
  TestValidator.predicate("same actual lookup cache object", sss.userData.autoMovieSubsurfaceTexture === another.userData.autoMovieSubsurfaceTexture);
  TestValidator.equals("shared half lookup facts", first.map((row: { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }): (number | readonly string[] | AutoMovieBuiltinTexturePurpose | "r16f" | "rgba8" | "rg16f" | "rgba16f" | "rgba32f" | undefined)[] => [row.purpose, row.texture.width, row.texture.height, row.texture.format, row.residents]),
    [["subsurface-lut", 64, 32, "r16f", ["scope"]]]);
  TestValidator.equals("repeat observation keeps one shared lookup row", read(scene, first).length, 1);
  const multipleScopes: { residents: string[]; owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; }[] = first.map((row: { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }): { residents: string[]; owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; } => ({ ...row, residents: ["other", "scope"] }));
  TestValidator.equals("current use preserves other live scope", read(scene, multipleScopes)[0].residents, ["other", "scope"]);
  const empty: ThreeTypes.Scene<ThreeTypes.Object3DEventMap> = new THREE.Scene();
  TestValidator.equals("material removal retains context facts", read(empty, first).map((row: { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }): (number | readonly string[] | undefined)[] => [row.texture.width, row.texture.height, row.residents]), [[64, 32, []]]);
  TestValidator.equals("scope replacement removes only its own use", read(empty, multipleScopes)[0].residents, ["other"]);
  TestValidator.equals("host cleared facts after release", read(empty), []);
  const cache: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<ThreeTypes.DataTexture> => new THREE.DataTexture(new Uint8Array(64), 4, 4));
  await cache.prime(["color", "normal"]);
  const overlay: ThreeTypes.MeshPhysicalMaterial = buildMaterial({ ...material("overlay"), overlays: [{ baseColorTexture: "color", normalTexture: "normal", blend: "multiply", strength: 1 }] }, cache.resolve);
  scene.add(new THREE.Mesh(geometry, overlay));
  const flat: { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; } = read().find((row: { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }): boolean => row.purpose === "overlay-flat-normal")!;
  TestValidator.equals("actual one-texel fallback", [flat.texture.width, flat.texture.height, flat.texture.format], [1, 1, "rgba8"]);
  TestValidator.predicate("actual fallback supplies its normal slot", overlay.normalMap === overlay.userData.autoMovieOverlayFlatNormal);
  const ordinary: ThreeTypes.MeshPhysicalMaterial = buildMaterial(material("ordinary"));
  scene.add(new THREE.Mesh(geometry, ordinary), new THREE.Group());
  TestValidator.equals("ordinary objects add no lookup", read().length, 2);
  const unsupported: ThreeTypes.MeshBasicMaterial = new THREE.MeshBasicMaterial();
  const invalidScene: ThreeTypes.Scene<ThreeTypes.Object3DEventMap> = new THREE.Scene();
  invalidScene.add(new THREE.Mesh(geometry, unsupported));
  for (const value of [null, 7, {}, { isMaterial: false }])
    invalidScene.add(Object.assign(new THREE.Object3D(), { material: value }));
  for (const value of [null, 7, {}, { isTexture: false }]) {
    unsupported.userData.autoMovieSubsurfaceTexture = value;
    TestValidator.equals("invalid producer metadata yields no invented lookup", read(invalidScene), []);
  }
  const materialArray: ThreeTypes.Object3D<ThreeTypes.Object3DEventMap> & { material: ThreeTypes.MeshPhysicalMaterial[]; } = Object.assign(new THREE.Object3D(), { material: [sss, another] });
  invalidScene.add(materialArray);
  TestValidator.equals("material arrays preserve actual sharing", read(invalidScene).length, 1);
  const area: ThreeTypes.Light = buildLight({ id: "area", type: "area", width: 1, height: 1, castShadow: false,
    color: { r: 1, g: 1, b: 1, a: 1, hex: null }, intensity: 1,
    transform: { translation: { x: 0, y: 0, z: 2 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } },
  });
  scene.add(area);
  invalidScene.remove(materialArray);
  invalidScene.add(area);
  TestValidator.equals("area light without PBR contributes no lookup row", read(invalidScene), []);
  scene.add(area);
  for (const [float, format, width] of [[true, "rgba32f", 16], [false, "rgba16f", 8]] as const) {
    const pair: { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }[] = read(scene, [], float).filter((row: { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }): boolean => row.purpose === "area-ltc-1" || row.purpose === "area-ltc-2");
    TestValidator.equals("actual chosen LTC pair", pair.map((row: { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }): (number | "r16f" | "rgba8" | "rg16f" | "rgba16f" | "rgba32f" | undefined)[] => [row.texture.width, row.texture.height, row.texture.format]), [[64, 64, format], [64, 64, format]]);
    TestValidator.equals("independent LTC component arithmetic", pair.reduce((sum: number, row: { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }): number => sum + measureAutoMovieTextureStorage({ ...row.texture, bytesPerTexel: width })!, 0), 2 * 64 * 64 * width);
  }
  geometry.dispose(); sss.dispose(); another.dispose(); overlay.dispose(); ordinary.dispose(); unsupported.dispose();
  await cache.dispose();
}
