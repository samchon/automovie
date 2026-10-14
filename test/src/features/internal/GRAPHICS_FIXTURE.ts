import type { IAutoMovieCaptureRuntimeIdentity } from "@automovie/interface";

/**
 * Preserve the existing SwiftShader-shaped graphics input. Its contract type checks portable preflight consumption; no scaffold host, driver, browser or physical GPU was queried to obtain or validate these supplied strings.
 */
export const GRAPHICS_FIXTURE: IAutoMovieCaptureRuntimeIdentity["graphics"] = {
  requestedBackend: "angle:swiftshader",
  api: "webgl2",
  vendor: "Google Inc. (Google)",
  renderer: "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))",
};
