import * as THREE from "three";

/**
 * Prepare a scene's environment image for Three's equirectangular conversion.
 *
 * A texture already mapped as an equirectangular reflection in the requested
 * colour space is left as it is, so its cube/PMREM conversion is reused.
 * Otherwise its earlier conversions are released through `dispose`, the mapping
 * and colour space are set, and an upload is requested.
 */
export namespace AutoMovieEnvironmentTextureOwnership {
  /**
   * Set an environment texture's mapping and colour space for the scene.
   *
   * @param texture The environment image's texture.
   * @param colorSpace The colour space its image is decoded in.
   */
  export function prepare(
    texture: THREE.Texture,
    colorSpace: THREE.ColorSpace,
  ): void {
    if (
      texture.mapping === THREE.EquirectangularReflectionMapping &&
      texture.colorSpace === colorSpace
    )
      return;
    texture.dispose();
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = colorSpace;
    texture.needsUpdate = true;
  }
}
