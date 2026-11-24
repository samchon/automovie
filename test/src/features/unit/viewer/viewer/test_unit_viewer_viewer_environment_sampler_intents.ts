import {
  applySceneEnvironment,
  readAutoMovieTextureSource,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * Factory sampling facts describe bounded conversion intent while leaving the scene-owned texture's configured fields unchanged.
 *
 * Scenarios:
 * 1. Mip-linear input reports a linear conversion choice while retaining its configured sampler, public version and generated storage policy.
 * 2. Other supported native filters retain their own choice, including a filter outside the authorable union; unsupported wrap/filter facts stay null.
 */
export function test_unit_viewer_viewer_environment_sampler_intents(): void {
  const texture: THREE.DataTexture = new THREE.DataTexture(
    new Uint8Array(64),
    4,
    4,
  );
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  const scene: THREE.Scene = new THREE.Scene();
  applySceneEnvironment(
    scene,
    {
      image: "sky",
      background: null,
      intensity: 1,
      rotationDeg: 0,
      exposure: 1,
      toneMapping: "none",
      shadows: { enabled: false, type: "pcf" },
    },
    texture,
  );
  const version: number = texture.version;
  const first: ReturnType<typeof readAutoMovieTextureSource> =
    readAutoMovieTextureSource("sky", texture);
  TestValidator.equals(
    "factory linear choice differs from configured mip sampling",
    [first.sampler?.minFilter, first.environmentSampler?.minFilter],
    ["linearMipmapLinear", "linear"],
  );
  TestValidator.equals(
    "actual native factory choice is preserved as an intent",
    first.environmentSamplerState,
    JSON.stringify([
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping,
      THREE.LinearFilter,
      THREE.LinearFilter,
    ]),
  );
  TestValidator.equals(
    "observation does not change configured policy or public version",
    [texture.version, texture.minFilter, texture.generateMipmaps],
    [version, THREE.LinearMipmapLinearFilter, true],
  );
  for (const filter of [
    THREE.NearestFilter,
    THREE.LinearFilter,
    THREE.NearestMipmapNearestFilter,
  ]) {
    texture.minFilter = filter;
    const fact: ReturnType<typeof readAutoMovieTextureSource> =
      readAutoMovieTextureSource("sky", texture);
    TestValidator.equals(
      "unmodified native filters retain their conversion choice",
      fact.environmentSamplerState,
      JSON.stringify([
        THREE.ClampToEdgeWrapping,
        THREE.ClampToEdgeWrapping,
        filter,
        THREE.LinearFilter,
      ]),
    );
  }
  Object.assign(texture, { wrapS: Number.NaN });
  TestValidator.equals(
    "unsupported native wrapping cannot certify factory sampling",
    [
      readAutoMovieTextureSource("sky", texture).environmentSampler,
      readAutoMovieTextureSource("sky", texture).environmentSamplerState,
    ],
    [undefined, null],
  );
  texture.wrapS = THREE.ClampToEdgeWrapping;
  Object.assign(texture, { minFilter: Number.NaN });
  TestValidator.equals(
    "unsupported native filter keeps explicit unknown intent",
    readAutoMovieTextureSource("sky", texture).environmentSamplerState,
    null,
  );
  texture.dispose();
}
