import { readAutoMovieTransmissionTextureTarget } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * The native transmission factory profile follows observed viewport, scale,
 * component capability and samples. This unit checks metadata mapping and makes
 * no claim about a rendered frame or a measured driver allocation.
 *
 * Scenarios:
 *
 * 1. Byte fallback and either half-float capability select the native formats;
 *    samples below four keep the native four-sample bound and larger counts persist.
 * 2. A public camera viewport overrides the renderer's physical viewport;
 *    fractional scale follows the native target's integer extent.
 */
export const test_viewer_transmission_target_profile = async (): Promise<void> => {
  const THREE = await import("three");
  const camera = new THREE.PerspectiveCamera();
  const facts = (capabilities: string[], samples = 0) => ({
    getCurrentViewport: (target: InstanceType<typeof THREE.Vector4>) => target.set(0, 0, 7, 5),
    transmissionResolutionScale: 0.5,
    capabilities: { samples },
    extensions: { has: (name: string) => capabilities.includes(name) },
  });
  TestValidator.equals("byte capability fallback", readAutoMovieTransmissionTextureTarget("view", "shot", facts([]), camera), {
    owner: "view", transmissionScope: "shot", width: 3, height: 2,
    formats: ["rgba8"], mipmapped: true, samples: 4, depthBytesPerTexel: 4, depthTexture: false,
  });
  for (const capability of ["EXT_color_buffer_half_float", "EXT_color_buffer_float"])
    TestValidator.equals("either half-float capability", readAutoMovieTransmissionTextureTarget("view", "shot", facts([capability], 8), camera).formats, ["rgba16f"]);
  TestValidator.equals("actual requested sample population", readAutoMovieTransmissionTextureTarget("view", "shot", facts([], 8), camera).samples, 8);
  for (const viewport of [undefined, null, false, 0])
    TestValidator.equals("falsy viewport uses renderer facts", readAutoMovieTransmissionTextureTarget("view", "shot", facts([]), Object.assign(camera, { viewport })).width, 3);
  TestValidator.equals("native structural viewport extent", readAutoMovieTransmissionTextureTarget("view", "shot", facts([]),
    Object.assign(camera, { viewport: { x: 1, y: 2, z: 12, w: 8 } })).width, 6);
  for (const viewport of ["invalid", {}, { z: "12", w: "8" }, { z: NaN, w: Infinity }]) {
    const unknown = readAutoMovieTransmissionTextureTarget("view", "shot", facts([]), Object.assign(camera, { viewport }));
    TestValidator.predicate("invalid truthy viewport retains unknown extents", !Number.isFinite(unknown.width) && !Number.isFinite(unknown.height));
  }
  const cameraViewport = Object.assign(camera, { viewport: new THREE.Vector4(1, 2, 12, 8) });
  TestValidator.equals("camera viewport overrides the renderer", [readAutoMovieTransmissionTextureTarget("view", "shot", facts([]), cameraViewport).width,
    readAutoMovieTransmissionTextureTarget("view", "shot", facts([]), cameraViewport).height], [6, 4]);
};
