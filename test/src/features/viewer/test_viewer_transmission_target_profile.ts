import { readAutoMovieTransmissionTextureTarget } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * Exercises the prospective transmission factory profile from supplied public viewport/capability facts.
 *
 * Scenarios:
 * 1. Absent half-float capabilities use byte format; either extension selects half-float and authored requested sample counts remain.
 * 2. Falsy viewport facts use the supplied host; structural/camera viewport facts override it and malformed truthy extents stay nonfinite.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual profile projection, comparing color fallback, requested samples and floored viewport-times-scale extents.
 * @evidence contracts/testing.md#independent-expectations Authored 7x5 host/12x8 camera viewports, half scale and four/eight sample expectations define independent bounds rather than measured native storage.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts either half-float extension, byte fallback, falsy/current/camera/invalid truthy viewport facts; malformed extents stay nonfinite instead of a guessed safe size.
 * @evidence contracts/testing.md#execution-ownership The named entry retains its existing caller-owned host callbacks and CPU camera, creates no native target/renderer/mock driver and claims no rendered or released GPU storage.
 */
export async function test_viewer_transmission_target_profile(): Promise<void> {
  const THREE: typeof import("three") = await import("three");
  const camera: import("three").PerspectiveCamera = new THREE.PerspectiveCamera();
  const facts: (capabilities: string[], samples?: number) => { getCurrentViewport: (target: InstanceType<typeof import("three").Vector4>) => import("three").Vector4; transmissionResolutionScale: number; capabilities: { samples: number; }; extensions: { has: (name: string) => boolean; }; } = (capabilities: string[], samples: number = 0): { getCurrentViewport: (target: InstanceType<typeof import("three").Vector4>) => import("three").Vector4; transmissionResolutionScale: number; capabilities: { samples: number; }; extensions: { has: (name: string) => boolean; }; } => ({
    getCurrentViewport: (target: InstanceType<typeof THREE.Vector4>): import("three").Vector4 => target.set(0, 0, 7, 5),
    transmissionResolutionScale: 0.5,
    capabilities: { samples },
    extensions: { has: (name: string): boolean => capabilities.includes(name) },
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
    const unknown: import("@automovie/engine").IAutoMovieRenderTextureTarget = readAutoMovieTransmissionTextureTarget("view", "shot", facts([]), Object.assign(camera, { viewport }));
    TestValidator.predicate("invalid truthy viewport retains unknown extents", !Number.isFinite(unknown.width) && !Number.isFinite(unknown.height));
  }
  const cameraViewport: import("three").PerspectiveCamera & { viewport: import("three").Vector4; } = Object.assign(camera, { viewport: new THREE.Vector4(1, 2, 12, 8) });
  TestValidator.equals("camera viewport overrides the renderer", [readAutoMovieTransmissionTextureTarget("view", "shot", facts([]), cameraViewport).width,
    readAutoMovieTransmissionTextureTarget("view", "shot", facts([]), cameraViewport).height], [6, 4]);
}
