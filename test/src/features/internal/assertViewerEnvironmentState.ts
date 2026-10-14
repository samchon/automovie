import type { IAutoMovieSceneEnvironment } from "@automovie/interface";
import {
  applyRenderMode,
  applyRendererEnvironment,
  applySceneEnvironment,
  buildLight,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { namedFacts, nclose } from "./predicates";

/**
 * Exercise the PBR unit's existing scene-image, reversible renderer-policy and native light-field cases.
 *
 * The PBR scenario calls this helper to apply/clear environment objects, suspend guides, restore policy and build light shadow fields, detecting lost authored state or incorrect policy precedence.
 * Literal linear color/exposure/shadow-camera values and original object identities define expected output; Texture version increments request native refresh but do not establish uploads or pixels, and the local renderer policy record owns no GPU context.
 * Covers LDR/HDR metadata, solid/unresolved/null images, structural/beauty policy, scene/delivery precedence, PCF/VSM/disabled shadows and legacy light defaults; sharing and failed texture handoffs belong to the ownership helper.
 */
export const assertViewerEnvironmentState: (
  ENVIRONMENT: IAutoMovieSceneEnvironment,
) => void = (ENVIRONMENT: IAutoMovieSceneEnvironment): void => {
  const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
  const texture: THREE.Texture<unknown, THREE.TextureEventMap> =
    new THREE.Texture();
  const ldrVersion: number = texture.version;
  applySceneEnvironment(scene, ENVIRONMENT, texture);
  TestValidator.equals(
    "IBL image configures scene environment and background",
    namedFacts([
      ["environment", (): boolean => scene.environment === texture],
      ["background", (): boolean => scene.background === texture],
      [
        "mapping",
        (): boolean =>
          texture.mapping === THREE.EquirectangularReflectionMapping,
      ],
      [
        "rotation",
        (): boolean => nclose(scene.environmentRotation.y, Math.PI / 2),
      ],
      ["intensity", (): boolean => nclose(scene.environmentIntensity, 0.75)],
    ]),
    {
      environment: true,
      background: true,
      mapping: true,
      rotation: true,
      intensity: true,
    },
  );
  // Byte and floating image storage select sRGB and linear decoding metadata respectively.
  const hdr: THREE.DataTexture = new THREE.DataTexture(
    new Uint16Array(4),
    1,
    1,
    THREE.RGBAFormat,
    THREE.HalfFloatType,
  );
  const hdrVersion: number = hdr.version;
  applySceneEnvironment(scene, ENVIRONMENT, hdr);
  TestValidator.equals(
    "environment decoding follows the image's own storage",
    namedFacts([
      ["ldrSrgb", (): boolean => texture.colorSpace === THREE.SRGBColorSpace],
      ["ldrVersionAdvanced", (): boolean => texture.version > ldrVersion],
      [
        "hdrLinear",
        (): boolean => hdr.colorSpace === THREE.LinearSRGBColorSpace,
      ],
      ["hdrVersionAdvanced", (): boolean => hdr.version > hdrVersion],
      ["hdrMounted", (): boolean => scene.environment === hdr],
    ]),
    {
      ldrSrgb: true,
      ldrVersionAdvanced: true,
      hdrLinear: true,
      hdrVersionAdvanced: true,
      hdrMounted: true,
    },
  );
  applySceneEnvironment(scene, ENVIRONMENT, texture);
  const normalPass: ReturnType<typeof applyRenderMode> = applyRenderMode(
    scene,
    "normal",
  );
  TestValidator.equals(
    "structural mode suspends and restores image lighting independently",
    namedFacts([
      ["environmentCleared", (): boolean => scene.environment === null],
      [
        "backgroundIsColor",
        (): boolean => scene.background instanceof THREE.Color,
      ],
      [
        "backgroundBlack",
        (): boolean =>
          // The native family check narrows the background union inside this closure.
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

  const renderer: THREE.WebGLRenderer = {
    toneMapping: THREE.LinearToneMapping,
    toneMappingExposure: 3,
    shadowMap: { enabled: false, type: THREE.BasicShadowMap },
  } as unknown as THREE.WebGLRenderer;
  /** Read the four renderer policy fields written by the product. */
  const policy: () => {
    toneMapping: THREE.ToneMapping;
    exposure: number;
    shadows: boolean;
    shadowType: THREE.ShadowMapType;
  } = (): {
    toneMapping: THREE.ToneMapping;
    exposure: number;
    shadows: boolean;
    shadowType: THREE.ShadowMapType;
  } => ({
    toneMapping: renderer.toneMapping,
    exposure: renderer.toneMappingExposure,
    shadows: renderer.shadowMap.enabled,
    shadowType: renderer.shadowMap.type,
  });
  /** Compare policy enums and exposure against the caller's authored values. */
  const assertPolicy: (
    message: string,
    expected: ReturnType<typeof policy>,
  ) => void = (message: string, expected: ReturnType<typeof policy>): void => {
    const current: ReturnType<typeof policy> = policy();
    TestValidator.predicate(
      message,
      current.toneMapping === expected.toneMapping &&
        nclose(current.exposure, expected.exposure, 0) &&
        current.shadows === expected.shadows &&
        current.shadowType === expected.shadowType,
    );
  };
  const beauty: ReturnType<typeof applyRendererEnvironment> =
    applyRendererEnvironment(renderer, ENVIRONMENT, "beauty");
  assertPolicy("beauty applies tone, exposure and shadows", {
    toneMapping: THREE.ACESFilmicToneMapping,
    exposure: 1.25,
    shadows: true,
    shadowType: THREE.PCFShadowMap,
  });
  beauty.restore();
  beauty.restore();
  assertPolicy("renderer state restores idempotently", {
    toneMapping: THREE.LinearToneMapping,
    exposure: 3,
    shadows: false,
    shadowType: THREE.BasicShadowMap,
  });
  const structural: ReturnType<typeof applyRendererEnvironment> =
    applyRendererEnvironment(renderer, ENVIRONMENT, "mask");
  TestValidator.predicate(
    "structural pass bypasses photographic settings",
    renderer.toneMapping === THREE.NoToneMapping &&
      nclose(renderer.toneMappingExposure, 1, 0) &&
      renderer.shadowMap.enabled === false,
  );
  structural.restore();
  const legacyBeauty: ReturnType<typeof applyRendererEnvironment> =
    applyRendererEnvironment(renderer, null, "beauty");
  assertPolicy("legacy beauty leaves host renderer policy unchanged", {
    toneMapping: THREE.LinearToneMapping,
    exposure: 3,
    shadows: false,
    shadowType: THREE.BasicShadowMap,
  });
  legacyBeauty.restore();
  const legacyStructural: ReturnType<typeof applyRendererEnvironment> =
    applyRendererEnvironment(renderer, null, "normal");
  TestValidator.predicate(
    "legacy structural pass still bypasses photographic renderer state",
    renderer.toneMapping === THREE.NoToneMapping &&
      nclose(renderer.toneMappingExposure, 1, 0) &&
      renderer.shadowMap.enabled === false,
  );
  legacyStructural.restore();
  // The delivery curve applies only when the scene environment supplies none.
  const delivered: ReturnType<typeof applyRendererEnvironment> =
    applyRendererEnvironment(renderer, null, "beauty", "acesFilmic");
  TestValidator.predicate(
    "the render spec curve applies only to an environment-less scene",
    renderer.toneMapping === THREE.ACESFilmicToneMapping &&
      nclose(renderer.toneMappingExposure, 3, 0),
  );
  delivered.restore();
  const overridden: ReturnType<typeof applyRendererEnvironment> =
    applyRendererEnvironment(
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
  const deliveredStructural: ReturnType<typeof applyRendererEnvironment> =
    applyRendererEnvironment(renderer, null, "depth", "acesFilmic");
  TestValidator.equals(
    "a structural pass ignores the delivery curve too",
    renderer.toneMapping,
    THREE.NoToneMapping,
  );
  deliveredStructural.restore();
  const none: ReturnType<typeof applyRendererEnvironment> =
    applyRendererEnvironment(
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
  const vsm: ReturnType<typeof applyRendererEnvironment> =
    applyRendererEnvironment(
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
  // A disabled scene shadow policy must suspend an already enabled host policy before restoring it.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const shadowless: ReturnType<typeof applyRendererEnvironment> =
    applyRendererEnvironment(
      renderer,
      { ...ENVIRONMENT, shadows: { enabled: false, type: "vsm" } },
      "beauty",
    );
  const suspended: boolean = !renderer.shadowMap.enabled;
  shadowless.restore();
  TestValidator.equals(
    "a shadowless scene overrides a shadow-casting host and gives it back",
    [suspended, renderer.shadowMap.enabled, renderer.shadowMap.type],
    [true, true, THREE.PCFShadowMap],
  );
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.BasicShadowMap;

  const shadowed: THREE.DirectionalLight = buildLight({
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
  TestValidator.predicate(
    "light shadow settings reach its camera and map",
    shadowed.castShadow &&
      shadowed.shadow.mapSize.x === 512 &&
      nclose(shadowed.shadow.bias, -0.001, 0) &&
      nclose(shadowed.shadow.normalBias, 0.1, 0) &&
      nclose(shadowed.shadow.camera.near, 0.2, 0) &&
      nclose(shadowed.shadow.camera.far, 80, 0),
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
