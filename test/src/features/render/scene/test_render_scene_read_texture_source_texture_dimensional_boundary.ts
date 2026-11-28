import type { IAutoMovieRenderTextureSource } from "@automovie/interface";
import { AutoMovieRenderSceneTexture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import type { Texture, TextureEventMap, WebGLRenderTarget } from "three";

/**
 * Exercises ordinary decoded-image facts at unsupported dimensional and
 * target-attachment boundaries.
 *
 * Scenarios:
 *
 * 1. An ordinary RGBA8 image contrasts array/volume/compressed families with both
 *    one and two layers/depths.
 * 2. Volume image and target attachment metadata refuse ordinary source
 *    representation while preserving diagnostic extents.
 * 3. Changing owned depth wrapping changes the upload-state key.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify ordinary decoded data, array, volume and compressed images, and target attachments with owned depth.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that unsupported dimensional families lose ordinary source authority while their extents remain available, and that changed owned depth wrapping changes its upload key.
 * @evidence contracts/development/testing.md#independent-expectations Compares explicit family fixtures at equal base dimensions and at one or two layers, with an independent wrap-mode change on the target depth attachment.
 */
export async function test_render_scene_read_texture_source_texture_dimensional_boundary(): Promise<void> {
  const THREE: typeof import("three") = await import("three");
  const image: import("three").DataTexture = new THREE.DataTexture(
    new Uint8Array(64),
    4,
    4,
  );
  TestValidator.equals(
    "supported two-dimensional image",
    AutoMovieRenderSceneTexture.readSource("image", image).format,
    "rgba8",
  );
  for (const texture of [
    new THREE.DataArrayTexture(new Uint8Array(128), 4, 4, 2),
    new THREE.DataArrayTexture(new Uint8Array(64), 4, 4, 1),
    new THREE.Data3DTexture(new Uint8Array(128), 4, 4, 2),
    new THREE.Data3DTexture(new Uint8Array(64), 4, 4, 1),
    new THREE.CompressedArrayTexture([], 4, 4, 2, THREE.RGBA_S3TC_DXT5_Format),
    new THREE.CompressedArrayTexture([], 4, 4, 1, THREE.RGBA_S3TC_DXT5_Format),
  ]) {
    texture.internalFormat = "RGBA8";
    TestValidator.equals(
      "unsupported dimensional storage stays unknown",
      AutoMovieRenderSceneTexture.readSource("layers", texture).format,
      undefined,
    );
    texture.dispose();
  }
  const volumeImage: {
    data: Uint8Array<ArrayBuffer>;
    width: number;
    height: number;
    depth: number;
  } = { data: new Uint8Array(128), width: 4, height: 4, depth: 2 };
  image.image = volumeImage;
  TestValidator.equals(
    "a volume extent cannot masquerade as two-dimensional",
    AutoMovieRenderSceneTexture.readSource("image", image).format,
    undefined,
  );
  const target: WebGLRenderTarget<Texture<unknown, TextureEventMap>> =
    new THREE.WebGLRenderTarget(4, 4);
  const facts: IAutoMovieRenderTextureSource = AutoMovieRenderSceneTexture.readSource(
    "target",
    target.texture,
  );
  TestValidator.equals(
    "target attachment boundary",
    [facts.width, facts.height, facts.format],
    [4, 4, undefined],
  );
  const array: import("three").DataArrayTexture = new THREE.DataArrayTexture(
    new Uint8Array(64),
    4,
    4,
    1,
  );
  const before: string | undefined = AutoMovieRenderSceneTexture.readSource(
    "layers",
    array,
  ).uploadState;
  array.setValues({ wrapR: THREE.RepeatWrapping });
  TestValidator.predicate(
    "native depth wrapping changes upload state",
    AutoMovieRenderSceneTexture.readSource("layers", array).uploadState !== before,
  );
  target.dispose();
  array.dispose();
  image.dispose();
}
