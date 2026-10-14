import { readAutoMovieTextureSource } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * Exercises ordinary decoded-image facts at unsupported dimensional and target-attachment boundaries.
 *
 * Scenarios:
 * 1. An ordinary RGBA8 image contrasts array/volume/compressed families with both one and two layers/depths.
 * 2. Volume image and target attachment metadata refuse ordinary source representation while preserving diagnostic extents.
 * 3. Changing owned depth wrapping changes the upload-state key.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual texture observation over CPU image/array/volume/compressed/target objects, checking format refusal, diagnostic extents and upload-state identity.
 * @evidence contracts/testing.md#independent-expectations Authored dimensions/component layouts and a separately changed wrapR value determine expected representations without reading a GPU allocation.
 * @evidence contracts/testing.md#distinguishing-cases One/two layers and depths contrast ordinary RGBA8; target attachments and depth wrapping retain their separate owner instead of masquerading as ordinary decoded storage.
 * @evidence contracts/testing.md#execution-ownership The named entry owns and disposes actual CPU Three wrappers without a renderer, external decoder or new test driver; native allocation/release remain unobserved.
 */
export async function test_viewer_texture_dimensional_boundary(): Promise<void> {
  const THREE: typeof import("three") = await import("three");
  const image: import("three").DataTexture = new THREE.DataTexture(new Uint8Array(64), 4, 4);
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
  const volumeImage: { data: Uint8Array<ArrayBuffer>; width: number; height: number; depth: number; } = { data: new Uint8Array(128), width: 4, height: 4, depth: 2 };
  image.image = volumeImage;
  TestValidator.equals("a volume extent cannot masquerade as two-dimensional", readAutoMovieTextureSource("image", image).format, undefined);
  const target: import("three").WebGLRenderTarget<import("three").Texture<unknown, import("three").TextureEventMap>> = new THREE.WebGLRenderTarget(4, 4);
  const facts: import("@automovie/engine").IAutoMovieRenderTextureSource = readAutoMovieTextureSource("target", target.texture);
  TestValidator.equals("target attachment boundary", [facts.width, facts.height, facts.format], [4, 4, undefined]);
  const array: import("three").DataArrayTexture = new THREE.DataArrayTexture(new Uint8Array(64), 4, 4, 1);
  const before: string | undefined = readAutoMovieTextureSource("layers", array).uploadState;
  array.setValues({ wrapR: THREE.RepeatWrapping });
  TestValidator.predicate("native depth wrapping changes upload state", readAutoMovieTextureSource("layers", array).uploadState !== before);
  target.dispose();
  array.dispose();
  image.dispose();
}
