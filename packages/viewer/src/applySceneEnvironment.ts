import type {IAutoMovieSceneEnvironment} from "@automovie/interface";
import * as THREE from "three";
import { readAutoMovieEnvironmentColorSpace } from "./readAutoMovieEnvironmentColorSpace.js";
import { AutoMovieEnvironmentTextureOwnership } from "./AutoMovieEnvironmentTextureOwnership.js";

/**
 * Apply image lighting and background without adding scene-graph children.
 *
 * A declared image reaches the scene only when the host resolved it; an image
 * the host could not decode leaves the scene explicitly unlit and transparent
 * rather than silently falling back to a background the author did not declare.
 * The resolved texture is configured here (equirectangular mapping and the
 * decoding its own storage implies), so the caller hands over a texture object
 * this scene owns, never one a material is also writing sampling state onto.
 * The exclusive handoff retires earlier cube/PMREM conversions once. Stable
 * inputs keep their cache and version; legal content, sampling or generation
 * changes retire the old conversion before a replacement tuple is accepted.
 * Immutable capacity changes require a new Texture and decoded Source.
 * Shared ownership and failed retirement refuse before scene state changes.
 */
export const applySceneEnvironment = (
  scene: THREE.Scene,
  environment: IAutoMovieSceneEnvironment | null | undefined,
  texture?: THREE.Texture,
): void => {
  if (environment === null || environment === undefined) {
    scene.environment = null;
    scene.background = null;
    return;
  }
  if (environment.image !== null && texture !== undefined) {
    AutoMovieEnvironmentTextureOwnership.prepare(scene, texture, environmentColorSpace(texture));
    scene.environment = texture;
    scene.background = texture;
  } else {
    scene.environment = null;
    scene.background =
      environment.background === null
        ? null
        : new THREE.Color(
            environment.background.r,
            environment.background.g,
            environment.background.b,
          );
  }
  scene.environmentIntensity = environment.intensity;
  scene.environmentRotation.set(
    0,
    (environment.rotationDeg * Math.PI) / 180,
    0,
  );
  scene.backgroundRotation.copy(scene.environmentRotation);
};

/**
 * How an environment image's texels must be decoded, read off the decoded
 * texture instead of declared beside it.
 *
 * A material binding states its own `colorSpace` because one image can serve
 * either role; an environment image cannot. An 8-bit container (PNG, JPEG,
 * WebP) is display-referred, so its texels are sRGB-encoded and a mid-gray sky
 * sampled as linear lights the room off a radiance the image never held; a
 * Radiance HDR decodes to a float texture that already carries linear radiance,
 * which is exactly what `RGBELoader` records on it. `type` is that distinction,
 * and it follows from the media the builder already proved from the bytes, so
 * deriving the decoding here keeps one fact in one place rather than asking an
 * author to restate it and then refusing them for restating it wrong.
 */
const environmentColorSpace = (texture: THREE.Texture): THREE.ColorSpace =>
  readAutoMovieEnvironmentColorSpace(texture) === "srgb"
    ? THREE.SRGBColorSpace
    : THREE.LinearSRGBColorSpace;

