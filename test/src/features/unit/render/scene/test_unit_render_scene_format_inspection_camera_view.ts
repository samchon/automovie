import { formatAutoMovieInspectionCameraView } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `formatAutoMovieInspectionCameraView` writes a recorded camera as a fixed view
 * text that draws it again.
 *
 * Scenarios:
 *
 * 1. A perspective camera at (0, 0, 5) looking at the origin with +Y up is
 *    `0,0,5:0,0,0`.
 * 2. An orthographic one adds its scale, `@ortho=0.1`.
 * 3. An up that is not the one +Y implies is written, `@up=1,0,0`, and so is the
 *    up of a camera looking straight down, which +Y cannot imply.
 */
export function test_unit_render_scene_format_inspection_camera_view(): void {
  const camera = (patch: {
    position?: { x: number; y: number; z: number };
    up?: { x: number; y: number; z: number };
    projection?: "perspective" | "orthographic";
    metresPerPixel?: number | null;
  }) => ({
    view: "x",
    projection: patch.projection ?? "perspective",
    position: patch.position ?? { x: 0, y: 0, z: 5 },
    target: { x: 0, y: 0, z: 0 },
    up: patch.up ?? { x: 0, y: 1, z: 0 },
    fovDeg: 40,
    metresPerPixel: patch.metresPerPixel ?? null,
    near: 0.1,
    far: 100,
  });
  TestValidator.equals(
    "perspective",
    formatAutoMovieInspectionCameraView(camera({})),
    "0,0,5:0,0,0",
  );
  TestValidator.equals(
    "orthographic",
    formatAutoMovieInspectionCameraView(
      camera({ projection: "orthographic", metresPerPixel: 0.1 }),
    ),
    "0,0,5:0,0,0@ortho=0.1",
  );
  TestValidator.equals(
    "other up",
    formatAutoMovieInspectionCameraView(camera({ up: { x: 1, y: 0, z: 0 } })),
    "0,0,5:0,0,0@up=1,0,0",
  );
  TestValidator.equals(
    "straight down",
    formatAutoMovieInspectionCameraView(
      camera({ position: { x: 0, y: 5, z: 0 }, up: { x: 0, y: 0, z: -1 } }),
    ),
    "0,5,0:0,0,0@up=0,0,-1",
  );
}