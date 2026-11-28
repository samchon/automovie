import { AutoMovieRenderThreeKind, AutoMovieRenderInspectionCamera, AutoMovieRenderInspectionRequest } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/** Tolerance of the recorded camera. */
const CAMERA_TOLERANCE: number = 1e-9;

/**
 * `AutoMovieRenderInspectionCamera.resolveView` turns a view into the camera that draws it
 * and the record of that camera.
 *
 * Scenarios:
 *
 * 1. The film view is the film camera itself.
 * 2. A fixed view at (0, 0, 5) aimed at the origin is a perspective camera of
 *    the film's lens, recorded at that position and target.
 * 3. A fixed view at 0.1 m per pixel on a 50 pixel picture is orthographic with
 *    a half height of 2.5 m and records 0.1 m per pixel.
 * 4. A subject's own view is read at the drawn second and takes no switch.
 * 5. A named view with nothing to frame, an unknown name and a picture of no
 *    size are refused.
 * 6. A crop or zoom changes the exact key while preserving the lens summary.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases describe film-camera reuse, fixed lens placement, orthographic image scale, timed subject views and refusal controls.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that resolved camera and record retain the requested viewpoint and that missing bounds, unknown names, switches on subject views and zero raster size are refused.
 * @evidence contracts/development/testing.md#independent-expectations Uses the original film camera identity, literal view positions and `0.1 × 50 / 2 = 2.5` m for the orthographic half-height.
 */
export function test_render_scene_resolve_inspection_view(): void {
  const film: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(40, 2, 0.1, 100);
  const resolve = (
    text: string,
    patch: Partial<AutoMovieRenderInspectionCamera.IResolveViewProps> = {},
  ): AutoMovieRenderInspectionCamera.IResolveViewResult =>
    AutoMovieRenderInspectionCamera.resolveView({
      view: AutoMovieRenderInspectionRequest.parseView(text),
      text,
      bounds: null,
      camera: film,
      seconds: 0,
      width: 100,
      height: 50,
      ...patch,
    });
  TestValidator.predicate("film", resolve("film").camera === film);
  const crop: THREE.PerspectiveCamera = film.clone();
  crop.setViewOffset(100, 50, 0, 0, 50, 50);
  const zoom: THREE.PerspectiveCamera = film.clone();
  zoom.zoom = 2;
  zoom.updateProjectionMatrix();
  const point: THREE.Vector3 = new THREE.Vector3(0.7 * 5 * Math.tan(20 * Math.PI / 180) * 2, 0, -5);
  const keys: Set<string> = new Set();
  for (const [camera, expected] of [[film, 0.7], [crop, 2.4], [zoom, 1.4]] as const) {
    const { record } = resolve("film", { camera });
    TestValidator.equals("lens summary remains descriptive", record.fovDeg, 40);
    TestValidator.predicate("different applied projection", Math.abs(point.clone().project(camera).x - expected) < CAMERA_TOLERANCE);
    const key: string | null = AutoMovieRenderInspectionCamera.projectionKey(record.projectionIdentity);
    TestValidator.predicate("native projection key", key !== null);
    keys.add(key!);
  }
  TestValidator.equals("three exact keys", keys.size, 3);
  TestValidator.equals("legacy absent key", AutoMovieRenderInspectionCamera.projectionKey(undefined), null);
  TestValidator.equals("fractional raster lacks exact pixel identity", resolve("film", { width: 100.5 }).record.projectionIdentity, undefined);

  const fixed = resolve("0,0,5:0,0,0");
  TestValidator.equals(
    "fixed",
    [fixed.record.projection, fixed.record.position, fixed.record.target, fixed.record.fovDeg],
    ["perspective", { x: 0, y: 0, z: 5 }, { x: 0, y: 0, z: 0 }, 40],
  );
  const ortho = resolve("0,0,5:0,0,0@ortho=0.1");
  TestValidator.equals("ortho projection", ortho.record.projection, "orthographic");
  TestValidator.predicate(
    "ortho scale",
    ortho.record.metresPerPixel !== null &&
      Math.abs(ortho.record.metresPerPixel - 0.1) < CAMERA_TOLERANCE &&
      AutoMovieRenderThreeKind.isOrthographicCamera(ortho.camera) &&
      Math.abs(ortho.camera.top - 2.5) < CAMERA_TOLERANCE,
  );

  const own = resolve("walk", {
    views: {
      walk: (seconds: number) => ({
        position: { x: seconds, y: 0, z: 5 },
        target: { x: seconds, y: 0, z: 0 },
      }),
    },
    seconds: 3,
  });
  TestValidator.equals("own view", own.record.position, { x: 3, y: 0, z: 5 });
  TestValidator.error("own view with a switch", (): void => {
    resolve("walk@follow", {
      views: {
        walk: () => ({
          position: { x: 0, y: 0, z: 5 },
          target: { x: 0, y: 0, z: 0 },
        }),
      },
    });
  });
  TestValidator.error("nothing to frame", (): void => {
    resolve("front");
  });
  TestValidator.error("unknown name", (): void => {
    resolve("sideways");
  });
  TestValidator.error("no size", (): void => {
    resolve("film", { width: 0 });
  });
}
