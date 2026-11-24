import { readAutoMovieTransmissionTextureTarget } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * Exercises the prospective transmission factory profile from supplied public
 * viewport/capability facts.
 *
 * Scenarios:
 *
 * 1. Absent half-float capabilities use byte format; either extension selects
 *    half-float and authored requested sample counts remain.
 * 2. An absent viewport uses the supplied host; structural/camera viewport facts
 *    override it.
 */
export async function test_unit_render_scene_read_transmission_texture_target(): Promise<void> {
  const THREE: typeof import("three") = await import("three");
  const camera: import("three").PerspectiveCamera =
    new THREE.PerspectiveCamera();
  const facts: (
    capabilities: string[],
    samples?: number,
  ) => {
    getCurrentViewport: (
      target: InstanceType<typeof import("three").Vector4>,
    ) => import("three").Vector4;
    transmissionResolutionScale: number;
    capabilities: { samples: number };
    extensions: { has: (name: string) => boolean };
  } = (
    capabilities: string[],
    samples: number = 0,
  ): {
    getCurrentViewport: (
      target: InstanceType<typeof import("three").Vector4>,
    ) => import("three").Vector4;
    transmissionResolutionScale: number;
    capabilities: { samples: number };
    extensions: { has: (name: string) => boolean };
  } => ({
    getCurrentViewport: (
      target: InstanceType<typeof THREE.Vector4>,
    ): import("three").Vector4 => target.set(0, 0, 7, 5),
    transmissionResolutionScale: 0.5,
    capabilities: { samples },
    extensions: { has: (name: string): boolean => capabilities.includes(name) },
  });
  TestValidator.equals(
    "byte capability fallback",
    readAutoMovieTransmissionTextureTarget("view", "shot", facts([]), camera),
    {
      owner: "view",
      transmissionScope: "shot",
      width: 3,
      height: 2,
      formats: ["rgba8"],
      mipmapped: true,
      samples: 4,
      depthBytesPerTexel: 4,
      depthTexture: false,
    },
  );
  for (const capability of [
    "EXT_color_buffer_half_float",
    "EXT_color_buffer_float",
  ])
    TestValidator.equals(
      "either half-float capability",
      readAutoMovieTransmissionTextureTarget(
        "view",
        "shot",
        facts([capability], 8),
        camera,
      ).formats,
      ["rgba16f"],
    );
  TestValidator.equals(
    "actual requested sample population",
    readAutoMovieTransmissionTextureTarget("view", "shot", facts([], 8), camera)
      .samples,
    8,
  );
  TestValidator.equals(
    "an absent viewport uses renderer facts",
    readAutoMovieTransmissionTextureTarget(
      "view",
      "shot",
      facts([]),
      Object.assign(camera, { viewport: undefined }),
    ).width,
    3,
  );
  TestValidator.equals(
    "native structural viewport extent",
    readAutoMovieTransmissionTextureTarget(
      "view",
      "shot",
      facts([]),
      Object.assign(camera, { viewport: { x: 1, y: 2, z: 12, w: 8 } }),
    ).width,
    6,
  );
  const cameraViewport: import("three").PerspectiveCamera & {
    viewport: import("three").Vector4;
  } = Object.assign(camera, { viewport: new THREE.Vector4(1, 2, 12, 8) });
  TestValidator.equals(
    "camera viewport overrides the renderer",
    [
      readAutoMovieTransmissionTextureTarget(
        "view",
        "shot",
        facts([]),
        cameraViewport,
      ).width,
      readAutoMovieTransmissionTextureTarget(
        "view",
        "shot",
        facts([]),
        cameraViewport,
      ).height,
    ],
    [6, 4],
  );
}
