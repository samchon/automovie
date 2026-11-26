import type { IAutoMovieSceneEnvironment } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieEnvironmentTextureOwnership } from "./internal/AutoMovieEnvironmentTextureOwnership.js";
import { readAutoMovieEnvironmentColorSpace } from "./internal/readAutoMovieEnvironmentColorSpace.js";

/**
 * Apply image lighting and background without adding scene-graph children.
 *
 * A declared image reaches the scene only when the host resolved it; an image
 * the host could not decode leaves image lighting unset and uses the declared
 * solid background, or transparency when that background is null. The resolved
 * texture is configured here (equirectangular mapping and the color-space
 * convention selected from its storage type), so the caller hands over a
 * texture object this scene owns, never one a material is also writing sampling
 * state onto. The exclusive handoff retires earlier cube/PMREM conversions
 * once. Stable inputs keep their cache and version; legal content, sampling or
 * generation changes retire the old conversion before a replacement tuple is
 * accepted. Immutable capacity changes require a new Texture and decoded
 * Source. Shared ownership and failed retirement refuse before scene state
 * changes.
 */
export const applySceneEnvironment: (
  scene: THREE.Scene,
  environment: IAutoMovieSceneEnvironment | null | undefined,
  texture?: THREE.Texture,
) => void = (
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
    AutoMovieEnvironmentTextureOwnership.prepare(
      texture,
      environmentColorSpace(texture),
    );
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
 * Choose the environment color-space convention from decoded texture storage.
 *
 * Unsigned-byte textures are treated as sRGB; all other component types are
 * treated as linear. The decoder must supply data consistent with that
 * convention. Storage type alone does not establish an image's color profile,
 * transfer function or physical radiance, and this helper inspects none of
 * those properties. Material bindings have their own color-space role.
 */
const environmentColorSpace: (texture: THREE.Texture) => THREE.ColorSpace = (
  texture: THREE.Texture,
): THREE.ColorSpace =>
  readAutoMovieEnvironmentColorSpace(texture) === "srgb"
    ? THREE.SRGBColorSpace
    : THREE.LinearSRGBColorSpace;
