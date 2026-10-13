import { readAutoMovieTextureSource } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * Two-dimensional decode facts cannot certify volume, array or render-target
 * attachment storage. The supported twin remains bounded without mutating it.
 *
 * Scenarios:
 *
 * 1. A normal RGBA8 data image reports its format, while layered and volumetric
 *    textures, including one-layer arrays, retain an unknown representation.
 * 2. A target color texture remains unknown until its owning attachment profile
 *    is supplied; its width and height are still preserved for diagnostics.
 * 3. Native wrapR changes the fixed upload key even though UV placement does not.
 */
export const test_viewer_texture_dimensional_boundary = async (): Promise<void> => {
  const THREE = await import("three");
  const image = new THREE.DataTexture(new Uint8Array(64), 4, 4);
  TestValidator.equals("supported two-dimensional image", readAutoMovieTextureSource("image", image).format, "rgba8");
  for (const texture of [
    new THREE.DataArrayTexture(new Uint8Array(128), 4, 4, 2),
    new THREE.DataArrayTexture(new Uint8Array(64), 4, 4, 1),
    new THREE.Data3DTexture(new Uint8Array(128), 4, 4, 2),
    new THREE.Data3DTexture(new Uint8Array(64), 4, 4, 1),
    new THREE.CompressedArrayTexture([], 4, 4, 2, THREE.RGBA_S3TC_DXT5_Format),
    new THREE.CompressedArrayTexture([], 4, 4, 1, THREE.RGBA_S3TC_DXT5_Format),
  ]) {
    texture.internalFormat = "RGBA8";
    TestValidator.equals("unsupported dimensional storage stays unknown", readAutoMovieTextureSource("layers", texture).format, undefined);
    texture.dispose();
  }
  const volumeImage = { data: new Uint8Array(128), width: 4, height: 4, depth: 2 };
  image.image = volumeImage;
  TestValidator.equals("a volume extent cannot masquerade as two-dimensional", readAutoMovieTextureSource("image", image).format, undefined);
  const target = new THREE.WebGLRenderTarget(4, 4);
  const facts = readAutoMovieTextureSource("target", target.texture);
  TestValidator.equals("target attachment boundary", [facts.width, facts.height, facts.format], [4, 4, undefined]);
  const array = new THREE.DataArrayTexture(new Uint8Array(64), 4, 4, 1);
  const before = readAutoMovieTextureSource("layers", array).uploadState;
  array.setValues({ wrapR: THREE.RepeatWrapping });
  TestValidator.predicate("native depth wrapping changes upload state", readAutoMovieTextureSource("layers", array).uploadState !== before);
  target.dispose();
  array.dispose();
  image.dispose();
};
