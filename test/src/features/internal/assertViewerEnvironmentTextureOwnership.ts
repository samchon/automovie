import type { IAutoMovieSceneEnvironment } from "@automovie/interface";
import { AutoMovieTextureCache, applyMaterialOverlays, applySceneEnvironment, applySubsurfaceShading, buildLight, buildMaterial, readAutoMovieTextureSource } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type * as ThreeTypes from "three";
import { assessAutoMovieRenderBudget, autoMovieRenderBudgetEvidence, autoMovieRenderBudgetRefusal } from "@automovie/render";

import { compiledShotFixture } from "./renderBudgetFixtures";
import { material, sceneFixture } from "./renderFixtures";
import { throwsError } from "./predicates";

/**
 * Real texture handoffs preserve stable caches and refuse shared or uncertified
 * allocation state before a scene or material changes. Native disposal events
 * exercise failure and recovery without replacing any SDK method or GL host.
 *
 * Scenarios:
 * 1. Stable and legally refreshed decoded images preserve or retire the owned tuple.
 * 2. Actual cache clones share pixels while scene, material and shader roles stay exclusive.
 * 3. Capacity changes, incomplete layouts and throwing disposal refuse; valid replacements recover.
 * 4. Normal assessment propagates unknown bytes/counts and admits a recovered first draw.
 */
export const assertViewerEnvironmentTextureOwnership = async (): Promise<void> => {
  const THREE = await import("three");
  const environment: IAutoMovieSceneEnvironment = { image: "sky", background: null,
    intensity: 1, rotationDeg: 0, exposure: 1, toneMapping: "none", shadows: { enabled: false, type: "pcf" } };
  const make = () => new THREE.DataTexture(new Uint8Array(64), 4, 4);
  const read = (texture: ThreeTypes.Texture) => readAutoMovieTextureSource("sky", texture).allocationStateKnown;
  const scene = new THREE.Scene();
  for (const image of [{ width: 4 }, { height: 4 }, {}]) {
    const incomplete = new THREE.Texture();
    incomplete.image = image;
    applySceneEnvironment(new THREE.Scene(), environment, incomplete);
    TestValidator.predicate("ownership does not invent missing decoded dimensions", throwsError(() => readAutoMovieTextureSource("sky", incomplete), "extent"));
    incomplete.dispose();
  }
  const texture = make();
  let disposals = 0;
  texture.addEventListener("dispose", () => { ++disposals; });
  texture.mapping = THREE.EquirectangularReflectionMapping;
  TestValidator.equals("unmanaged converted source has no resident authority", read(texture), false);
  texture.mapping = THREE.EquirectangularRefractionMapping;
  TestValidator.equals("unmanaged refraction conversion also stays unknown", read(texture), false);
  applySceneEnvironment(scene, environment, texture);
  TestValidator.equals("owned initial handoff retires earlier conversions", [disposals, read(texture)], [1, true]);
  const version = texture.version;
  applySceneEnvironment(scene, environment, texture);
  TestValidator.equals("stable application preserves cache and version", [disposals, texture.version, read(texture)], [1, version, true]);
  for (const change of [
    () => { texture.generateMipmaps = !texture.generateMipmaps; },
    () => { texture.minFilter = THREE.LinearFilter; },
    () => { texture.magFilter = THREE.LinearFilter; },
    () => { texture.wrapS = THREE.RepeatWrapping; },
    () => { texture.wrapT = THREE.MirroredRepeatWrapping; },
    () => { texture.flipY = !texture.flipY; },
    () => { texture.premultiplyAlpha = !texture.premultiplyAlpha; },
    () => { texture.unpackAlignment = 8; },
    () => { texture.anisotropy = 2; },
    () => { texture.colorSpace = THREE.NoColorSpace; },
    () => { texture.mapping = THREE.EquirectangularRefractionMapping; },
    () => { texture.image.data = new Uint8Array(64); },
    () => { texture.image = { width: 4, height: 4, data: new Uint8Array(64) }; },
    () => { texture.needsUpdate = true; },
    () => { texture.mipmaps = []; },
  ]) {
    change();
    TestValidator.equals("changed conversion is unbounded before transition", read(texture), false);
    const before = disposals;
    applySceneEnvironment(scene, environment, texture);
    TestValidator.equals("legal refresh retires once and recovers", [disposals, read(texture)], [before + 1, true]);
  }
  texture.dispose(); texture.dispose();
  TestValidator.equals("external retirement cannot keep a known snapshot", read(texture), false);
  applySceneEnvironment(scene, environment, texture);
  TestValidator.equals("same-capacity public retirement recovers", read(texture), true);
  const foreign = new THREE.Scene();
  const oldBackground = new THREE.Color(0.25, 0.5, 0.75);
  foreign.background = oldBackground;
  const beforeForeign = [disposals, texture.version];
  TestValidator.predicate("another scene cannot take the wrapper", throwsError(() => applySceneEnvironment(foreign, environment, texture), "another scene"));
  TestValidator.equals("foreign claim changes neither allocation nor old scene", [disposals, texture.version], beforeForeign);
  TestValidator.predicate("both owning scene and rejected scene survive", scene.environment === texture && foreign.background === oldBackground);
  TestValidator.predicate("material cannot write a scene-owned wrapper", throwsError(() => buildMaterial(material("bad", "sky"), () => texture), "exclusively"));

  const base = make();
  const cache = new AutoMovieTextureCache(async () => base);
  await cache.prime(["sky"]);
  const first = cache.resolve("sky");
  applySceneEnvironment(new THREE.Scene(), environment, first);
  const second = cache.resolve("sky");
  applySceneEnvironment(new THREE.Scene(), environment, second);
  const bound = buildMaterial(material("surface", "sky"), cache.resolve);
  TestValidator.predicate("separate scene and material clones share pixels safely", first.source === second.source && first !== second && bound.map !== first);
  TestValidator.equals("normal shared Source touches do not invalidate wrappers", [read(first), read(second)], [true, true]);
  const materialTexture = make();
  const ordinary = buildMaterial(material("ordinary", "sky"), () => materialTexture);
  const materialVersion = materialTexture.version;
  TestValidator.predicate("material-owned wrapper cannot become environment", throwsError(() => applySceneEnvironment(new THREE.Scene(), environment, materialTexture), "material"));
  TestValidator.equals("material conflict does not touch native version", materialTexture.version, materialVersion);
  const geometry = new THREE.BoxGeometry();
  const foreignMaterial = new THREE.MeshBasicMaterial();
  const inspectedScene = new THREE.Scene();
  const inspected = make();
  const cyclic: Record<string, unknown> = { other: make(), leaf: null, scalar: 4 };
  cyclic.self = cyclic;
  foreignMaterial.userData = { cycle: cyclic, uniform: { value: [inspected] } };
  inspectedScene.add(new THREE.Mesh(geometry, [foreignMaterial]));
  TestValidator.predicate("native material arrays and cyclic uniform data expose sharing", throwsError(() => applySceneEnvironment(inspectedScene, environment, inspected), "material"));
  const otherScene = new THREE.Scene();
  otherScene.add(new THREE.Mesh(geometry, foreignMaterial), new THREE.Object3D());
  const emptySlots = new THREE.Object3D();
  Object.assign(emptySlots, { material: [null, undefined, 4] });
  otherScene.add(emptySlots);
  foreignMaterial.userData = { cycle: cyclic, vector: new THREE.Vector3(), absent: undefined };
  applySceneEnvironment(otherScene, environment, inspected);
  TestValidator.equals("non-texture native objects are not shared image bindings", read(inspected), true);
  foreignMaterial.map = inspected;
  TestValidator.equals("new native material sharing revokes ownership authority", read(inspected), false);
  TestValidator.predicate("changed scene sharing refuses before retirement", throwsError(() => applySceneEnvironment(otherScene, environment, inspected), "material"));
  foreignMaterial.map = null;
  TestValidator.equals("removing the unowned binding recovers stable allocation", read(inspected), true);
  const nullDictionary: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  const nullMaterialTexture = make();
  nullDictionary.image = nullMaterialTexture;
  foreignMaterial.userData = nullDictionary;
  TestValidator.predicate("null-prototype material data preserves actual texture refs", throwsError(() => applySceneEnvironment(inspectedScene, environment, nullMaterialTexture), "material"));
  buildLight({ id: "area", type: "area", width: 1, height: 1, intensity: 1, castShadow: false,
    color: { r: 1, g: 1, b: 1, a: 1, hex: null }, transform: { translation: { x: 0, y: 0, z: 1 },
      rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } } });
  for (const key of ["LTC_FLOAT_1", "LTC_FLOAT_2", "LTC_HALF_1", "LTC_HALF_2"]) {
    const ltc: unknown = Reflect.get(THREE.UniformsLib, key);
    TestValidator.predicate("actual rectangular lookup is initialized", ltc instanceof THREE.Texture);
    const lookup = ltc as ThreeTypes.Texture;
    const lookupVersion = lookup.version;
    TestValidator.predicate("shared native lookup cannot be retired as a scene image", throwsError(() => applySceneEnvironment(new THREE.Scene(), environment, lookup), "material"));
    TestValidator.equals("native lookup refusal preserves its upload version", lookup.version, lookupVersion);
  }
  const implicitMaterial = new THREE.MeshPhysicalMaterial();
  applySubsurfaceShading(implicitMaterial, { r: 1, g: 0.5, b: 0.25 });
  const overlayTexture = make();
  applyMaterialOverlays(implicitMaterial, [{ color: overlayTexture, normal: overlayTexture, roughness: null,
    normalScale: 1, strength: 1, blend: "multiply", colorFactor: { r: 1, g: 1, b: 1 } }]);
  for (const resource of [implicitMaterial.userData.autoMovieSubsurfaceTexture, implicitMaterial.normalMap]) {
    TestValidator.predicate("actual shader factory exposes its shared Texture", resource instanceof THREE.Texture);
    const sharedTexture = resource as ThreeTypes.Texture;
    const sharedVersion = sharedTexture.version;
    TestValidator.predicate("scene cannot retire an actual shared shader lookup", throwsError(() => applySceneEnvironment(new THREE.Scene(), environment, sharedTexture), "material"));
    TestValidator.equals("shared lookup refusal preserves its native inputs", sharedTexture.version, sharedVersion);
  }

  for (const mutate of [
    (value: ReturnType<typeof make>) => { value.type = THREE.HalfFloatType; },
    (value: ReturnType<typeof make>) => { value.format = THREE.RGFormat; },
    (value: ReturnType<typeof make>) => { value.internalFormat = "RGBA16F"; },
    (value: ReturnType<typeof make>) => { value.image.width = 8; },
    (value: ReturnType<typeof make>) => { value.image.height = 8; },
  ]) {
    const value = make();
    const owner = new THREE.Scene();
    applySceneEnvironment(owner, environment, value);
    mutate(value);
    TestValidator.equals("changed immutable allocation loses authority", read(value), false);
    const capacityVersion = value.version;
    let retired = 0;
    value.addEventListener("dispose", () => { retired++; });
    TestValidator.predicate("immutable mutation requires replacement", throwsError(() => applySceneEnvironment(owner, environment, value), ["Texture", "Source"]));
    TestValidator.equals("immutable refusal preserves native version and lifetime", [value.version, retired], [capacityVersion, 0]);
    TestValidator.predicate("immutable refusal preserves its owning scene", owner.environment === value && owner.background === value);
    TestValidator.predicate("a clone of the invalid Source is insufficient", throwsError(() => applySceneEnvironment(owner, environment, value.clone()), "decoded Source"));
    const replacement = make();
    applySceneEnvironment(owner, environment, replacement);
    TestValidator.equals("new Texture and Source recover ownership", read(replacement), true);
    value.dispose(); replacement.dispose();
  }
  const replacedSource = make();
  const replacementScene = new THREE.Scene();
  applySceneEnvironment(replacementScene, environment, replacedSource);
  const newData = make();
  replacedSource.source = newData.source;
  for (let attempt = 0; attempt < 2; ++attempt)
    TestValidator.predicate("changing Source on the same wrapper requires replacement", throwsError(() => applySceneEnvironment(replacementScene, environment, replacedSource), ["Texture", "Source"]));
  applySceneEnvironment(replacementScene, environment, newData);
  TestValidator.equals("a genuinely new wrapper and Source remain usable", read(newData), true);
  Object.assign(newData, { mipmaps: null });
  TestValidator.equals("malformed manual state remains unknown", read(newData), false);
  applySceneEnvironment(replacementScene, environment, newData);
  TestValidator.equals("ownership cannot certify malformed native mip storage", read(newData), false);
  newData.mipmaps = [];
  applySceneEnvironment(replacementScene, environment, newData);
  TestValidator.equals("supported empty mip list recovers", read(newData), true);
  const failed = make();
  const failedScene = new THREE.Scene();
  const failure = new Error("owned-disposal-failure");
  const fail = () => { throw failure; };
  failed.addEventListener("dispose", fail);
  let caught: unknown;
  try { applySceneEnvironment(failedScene, environment, failed); } catch (error) { caught = error; }
  TestValidator.predicate("initial retirement preserves its original failure", caught === failure);
  TestValidator.equals("failed retirement certifies no bytes or allocation", read(failed), false);
  TestValidator.predicate("failed claim has not changed the scene", failedScene.background === null && failedScene.environment === null);
  const compiled = compiledShotFixture({ models: [], scene: { ...sceneFixture(), nodes: [], lights: [], environment } });
  const assess = () => assessAutoMovieRenderBudget({ compiled, shot: "owned-environment", budget: null,
    textures: [readAutoMovieTextureSource("sky", failed)], assets: [],
    renderer: { api: "webgl2", vendor: "typed-owner-unit", device: "no-gpu-unit" },
    settings: { width: 32, height: 32, pixelRatio: 1, shadows: false, shadowType: "none", toneMapping: "none", exposure: 1 } });
  const refusal = (assessment: ReturnType<typeof assess>) => autoMovieRenderBudgetRefusal(autoMovieRenderBudgetEvidence({ tier: "unit", budgets: undefined, assessments: [assessment] }));
  const unknown = assess();
  TestValidator.equals("failed owner propagates null byte and count totals", [unknown.inventory!.totals.textureBytes, unknown.inventory!.totals.textures], [null, null]);
  TestValidator.predicate("normal preflight names its unresolved scene and source", refusal(unknown)!.includes("owned-environment") && refusal(unknown)!.includes("sky"));
  failed.removeEventListener("dispose", fail);
  applySceneEnvironment(failedScene, environment, failed);
  TestValidator.equals("successful retirement recovers the same immutable image", read(failed), true);
  const beforeFirstDraw = assess();
  TestValidator.equals("normal preflight admits before first native draw", refusal(beforeFirstDraw), null);
  TestValidator.equals("owned fresh factory keeps independent baseline bounds", [beforeFirstDraw.inventory!.totals.textureBytes, beforeFirstDraw.inventory!.totals.textures], [4 * 4 * 4 + 6 * 4 * 4 * (4 + 4), 2]);
  TestValidator.predicate("actual ownership recovery changes sealed target", beforeFirstDraw.target!.textureDigest !== unknown.target!.textureDigest);
  failed.addEventListener("dispose", fail);
  failed.generateMipmaps = true;
  caught = undefined;
  try { applySceneEnvironment(failedScene, environment, failed); } catch (error) { caught = error; }
  TestValidator.predicate("refresh failure keeps the owning scene and raw cause", caught === failure && failedScene.background === failed);
  TestValidator.equals("failed refresh stays unknown", read(failed), false);
  failed.removeEventListener("dispose", fail);
  applySceneEnvironment(failedScene, environment, failed);
  TestValidator.equals("successful refresh restores authority", read(failed), true);
  TestValidator.equals("generated refresh retains exact source and cube levels", assess().inventory!.totals.textureBytes,
    (16 + 4 + 1) * 4 + 6 * ((16 + 4 + 1) * 4 + 16 * 4));
  await cache.dispose(); await cache.dispose();
  texture.dispose(); materialTexture.dispose(); failed.dispose(); inspected.dispose(); replacedSource.dispose(); newData.dispose();
  nullMaterialTexture.dispose(); overlayTexture.dispose(); implicitMaterial.dispose();
  geometry.dispose(); foreignMaterial.dispose(); bound.dispose(); ordinary.dispose();
};
