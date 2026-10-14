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
 *
 * @evidence contracts/common.md#principled-implementation Applies admitted image lighting/background, intensity and degree-to-radian yaw through native scene fields; decoded texture storage determines sRGB/linear interpretation, and the exclusive texture ownership helper validates/retire-converts before image assignment. Unresolved image uses the declared solid/null background and no image lighting.
 * @evidence contracts/common.md#clear-and-simple-design Owns scene-field realization and delegates texture compatibility/conversion retirement to AutoMovieEnvironmentTextureOwnership; renderer tone/shadow policy stays with applyRendererEnvironment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses decoded texel representation rather than guessed file extension or fixture sky; null/unresolved image behavior is explicit, and no missing image is silently replaced with a successful stock environment.
 * @evidence contracts/common.md#meaningful-documentation Gives no-child scene attachment, image handoff exclusivity, actual decoding role, stable-input conversion reuse and resolved versus solid/transparent fallback semantics.
 * @evidence contracts/performance.md#efficient-algorithms Performs fixed-size scene/color/rotation assignment plus ownership helper validation/tuple comparison and any required conversion retirement; no scene-population or image-pixel scan is performed by this adapter.
 * @evidence contracts/performance.md#reuse-equivalent-work Stable texture/source/content-generation/sampling tuples reuse native conversion state; changed valid tuple is retired through the ownership helper, while scene scalar changes do not manufacture new decoded image data.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Scene holds the supplied environment/background texture and the exclusive ownership registry tracks it; clearing scene fields does not retire that texture or remove its ownership record, so the host must invoke its supported release boundary. The adapter owns no worker or render loop.
 */
export const applySceneEnvironment: (scene: THREE.Scene, environment: IAutoMovieSceneEnvironment | null | undefined, texture?: THREE.Texture) => void = (
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
const environmentColorSpace: (texture: THREE.Texture) => THREE.ColorSpace = (texture: THREE.Texture): THREE.ColorSpace =>
  readAutoMovieEnvironmentColorSpace(texture) === "srgb"
    ? THREE.SRGBColorSpace
    : THREE.LinearSRGBColorSpace;

