import type { IAutoMovieSceneEnvironment } from "@automovie/interface";
import { applyRenderMode, applyRendererEnvironment, applySceneEnvironment, buildLight } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { namedFacts, nclose } from "./predicates";

/** Existing scene, renderer and shadow-state assertions; restoration order and instances are unchanged. */
export const assertViewerEnvironmentState = (ENVIRONMENT: IAutoMovieSceneEnvironment): void => {
  const scene = new THREE.Scene();
  const texture = new THREE.Texture();
  const ldrVersion = texture.version;
  applySceneEnvironment(scene, ENVIRONMENT, texture);
  TestValidator.equals(
    "IBL image configures scene environment and background",
    namedFacts([
      ["environment", () => scene.environment === texture],
      ["background", () => scene.background === texture],
      [
        "mapping",
        () => texture.mapping === THREE.EquirectangularReflectionMapping,
      ],
      ["rotation", () => nclose(scene.environmentRotation.y, Math.PI / 2)],
      ["intensity", () => nclose(scene.environmentIntensity, 0.75)],
    ]),
    {
      environment: true,
      background: true,
      mapping: true,
      rotation: true,
      intensity: true,
    },
  );
  // An 8-bit sky stores sRGB-encoded texels and a float one stores linear
  // radiance, so a decoding left at the loader's default lights the room off a
  // radiance the image never held. The storage is the fact that decides it.
  const hdr = new THREE.DataTexture(
    new Uint16Array(4),
    1,
    1,
    THREE.RGBAFormat,
    THREE.HalfFloatType,
  );
  const hdrVersion = hdr.version;
  applySceneEnvironment(scene, ENVIRONMENT, hdr);
  TestValidator.equals(
    "environment decoding follows the image's own storage",
    namedFacts([
      ["ldrSrgb", () => texture.colorSpace === THREE.SRGBColorSpace],
      ["ldrUploaded", () => texture.version > ldrVersion],
      ["hdrLinear", () => hdr.colorSpace === THREE.LinearSRGBColorSpace],
      ["hdrUploaded", () => hdr.version > hdrVersion],
      ["hdrMounted", () => scene.environment === hdr],
    ]),
    {
      ldrSrgb: true,
      ldrUploaded: true,
      hdrLinear: true,
      hdrUploaded: true,
      hdrMounted: true,
    },
  );
  applySceneEnvironment(scene, ENVIRONMENT, texture);
  const normalPass = applyRenderMode(scene, "normal");
  TestValidator.equals(
    "structural mode suspends and restores image lighting independently",
    namedFacts([
      ["environmentCleared", () => scene.environment === null],
      ["backgroundIsColor", () => scene.background instanceof THREE.Color],
      [
        "backgroundBlack",
        () =>
          // The `instanceof` is restated only to narrow the union inside this
          // closure; a comparison cannot move the answer.
          scene.background instanceof THREE.Color &&
          scene.background.getHex() === 0,
      ],
    ]),
    {
      environmentCleared: true,
      backgroundIsColor: true,
      backgroundBlack: true,
    },
  );
  normalPass.restore();
  TestValidator.equals(
    "structural mode restores exact environment instances",
    {
      environment: scene.environment === texture,
      background: scene.background === texture,
    },
    { environment: true, background: true },
  );
  applySceneEnvironment(scene, {
    ...ENVIRONMENT,
    image: null,
    background: { r: 0.1, g: 0.2, b: 0.3, a: null, hex: null },
  });
  TestValidator.equals(
    "solid environment background clears IBL",
    {
      environmentCleared: scene.environment === null,
      backgroundIsColor: scene.background instanceof THREE.Color,
    },
    { environmentCleared: true, backgroundIsColor: true },
  );
  applySceneEnvironment(scene, { ...ENVIRONMENT, image: "missing.hdr" });
  TestValidator.equals(
    "unresolved environment image is explicit transparent no-IBL",
    {
      environmentCleared: scene.environment === null,
      backgroundCleared: scene.background === null,
    },
    { environmentCleared: true, backgroundCleared: true },
  );
  applySceneEnvironment(scene, null);
  TestValidator.equals(
    "null clears scene environment",
    {
      environmentCleared: scene.environment === null,
      backgroundCleared: scene.background === null,
    },
    { environmentCleared: true, backgroundCleared: true },
  );

  const renderer = {
    toneMapping: THREE.LinearToneMapping,
    toneMappingExposure: 3,
    shadowMap: { enabled: false, type: THREE.BasicShadowMap },
  } as unknown as THREE.WebGLRenderer;
  /** The photographic policy the renderer carries at this instant. */
  const policy = () => ({
    toneMapping: renderer.toneMapping,
    exposure: renderer.toneMappingExposure,
    shadows: renderer.shadowMap.enabled,
    shadowType: renderer.shadowMap.type,
  });
  const beauty = applyRendererEnvironment(renderer, ENVIRONMENT, "beauty");
  TestValidator.equals("beauty applies tone, exposure and shadows", policy(), {
    toneMapping: THREE.ACESFilmicToneMapping,
    exposure: 1.25,
    shadows: true,
    shadowType: THREE.PCFSoftShadowMap,
  });
  beauty.restore();
  beauty.restore();
  TestValidator.equals("renderer state restores idempotently", policy(), {
    toneMapping: THREE.LinearToneMapping,
    exposure: 3,
    shadows: false,
    shadowType: THREE.BasicShadowMap,
  });
  const structural = applyRendererEnvironment(renderer, ENVIRONMENT, "mask");
  TestValidator.equals(
    "structural pass bypasses photographic settings",
    {
      toneMapping: renderer.toneMapping,
      exposure: renderer.toneMappingExposure,
      shadows: renderer.shadowMap.enabled,
    },
    { toneMapping: THREE.NoToneMapping, exposure: 1, shadows: false },
  );
  structural.restore();
  const legacyBeauty = applyRendererEnvironment(renderer, null, "beauty");
  TestValidator.equals(
    "legacy beauty leaves host renderer policy unchanged",
    policy(),
    {
      toneMapping: THREE.LinearToneMapping,
      exposure: 3,
      shadows: false,
      shadowType: THREE.BasicShadowMap,
    },
  );
  legacyBeauty.restore();
  const legacyStructural = applyRendererEnvironment(renderer, null, "normal");
  TestValidator.equals(
    "legacy structural pass still bypasses photographic renderer state",
    {
      toneMapping: renderer.toneMapping,
      exposure: renderer.toneMappingExposure,
      shadows: renderer.shadowMap.enabled,
    },
    { toneMapping: THREE.NoToneMapping, exposure: 1, shadows: false },
  );
  legacyStructural.restore();
  // Precedence: the delivery curve reaches the renderer only where no scene
  // environment owns one, and never over a scene that does.
  const delivered = applyRendererEnvironment(
    renderer,
    null,
    "beauty",
    "acesFilmic",
  );
  TestValidator.equals(
    "the render spec curve applies only to an environment-less scene",
    {
      toneMapping: renderer.toneMapping,
      exposure: renderer.toneMappingExposure,
    },
    { toneMapping: THREE.ACESFilmicToneMapping, exposure: 3 },
  );
  delivered.restore();
  const overridden = applyRendererEnvironment(
    renderer,
    { ...ENVIRONMENT, toneMapping: "none" },
    "beauty",
    "acesFilmic",
  );
  TestValidator.equals(
    "a scene environment outranks the delivery default",
    renderer.toneMapping,
    THREE.NoToneMapping,
  );
  overridden.restore();
  const deliveredStructural = applyRendererEnvironment(
    renderer,
    null,
    "depth",
    "acesFilmic",
  );
  TestValidator.equals(
    "a structural pass ignores the delivery curve too",
    renderer.toneMapping,
    THREE.NoToneMapping,
  );
  deliveredStructural.restore();
  const none = applyRendererEnvironment(
    renderer,
    {
      ...ENVIRONMENT,
      toneMapping: "none",
      shadows: { enabled: true, type: "pcf" },
    },
    "beauty",
  );
  TestValidator.equals(
    "none tone map and PCF map exactly",
    { toneMapping: renderer.toneMapping, shadowType: renderer.shadowMap.type },
    { toneMapping: THREE.NoToneMapping, shadowType: THREE.PCFShadowMap },
  );
  none.restore();
  const vsm = applyRendererEnvironment(
    renderer,
    { ...ENVIRONMENT, shadows: { enabled: true, type: "vsm" } },
    "beauty",
  );
  TestValidator.equals(
    "VSM maps exactly",
    renderer.shadowMap.type,
    THREE.VSMShadowMap,
  );
  vsm.restore();
  // A scene that declares shadows off must turn them off, not merely decline to
  // turn them on: one renderer draws every shot on the page, so "leave it
  // alone" would inherit whatever the previous scene asked for.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const shadowless = applyRendererEnvironment(
    renderer,
    { ...ENVIRONMENT, shadows: { enabled: false, type: "vsm" } },
    "beauty",
  );
  const suspended = !renderer.shadowMap.enabled;
  shadowless.restore();
  TestValidator.equals(
    "a shadowless scene overrides a shadow-casting host and gives it back",
    [suspended, renderer.shadowMap.enabled, renderer.shadowMap.type],
    [true, true, THREE.PCFShadowMap],
  );
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.BasicShadowMap;

  const shadowed = buildLight({
    id: "sun",
    type: "directional",
    transform: {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    color: { r: 1, g: 1, b: 1, a: null, hex: null },
    intensity: 2,
    castShadow: true,
    shadow: { mapSize: 512, bias: -0.001, normalBias: 0.1, near: 0.2, far: 80 },
  }) as THREE.DirectionalLight;
  TestValidator.equals(
    "light shadow settings reach its camera and map",
    {
      castShadow: shadowed.castShadow,
      mapSize: shadowed.shadow.mapSize.x,
      bias: shadowed.shadow.bias,
      normalBias: shadowed.shadow.normalBias,
      near: shadowed.shadow.camera.near,
      far: shadowed.shadow.camera.far,
    },
    {
      castShadow: true,
      mapSize: 512,
      bias: -0.001,
      normalBias: 0.1,
      near: 0.2,
      far: 80,
    },
  );
  TestValidator.predicate(
    "light without shadow stays legacy",
    buildLight({
      id: "point",
      type: "point",
      transform: {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      color: { r: 1, g: 1, b: 1, a: null, hex: null },
      intensity: 1,
      range: 0,
    }).castShadow === false,
  );
};
