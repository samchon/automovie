import { AutoMovieThreeKind, resolveAutoMovieInspectionView, AutoMovieRenderInspectionRequest } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/** Tolerance of the recorded camera. */
const CAMERA_TOLERANCE: number = 1e-9;

/**
 * `resolveAutoMovieInspectionView` turns a view into the camera that draws it
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
 */
export function test_render_scene_resolve_inspection_view(): void {
  const film: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(40, 2, 0.1, 100);
  const resolve = (
    text: string,
    patch: Partial<Parameters<typeof resolveAutoMovieInspectionView>[0]> = {},
  ): ReturnType<typeof resolveAutoMovieInspectionView> =>
    resolveAutoMovieInspectionView({
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
      AutoMovieThreeKind.isOrthographicCamera(ortho.camera) &&
      Math.abs(ortho.camera.top - 2.5) < CAMERA_TOLERANCE,
  );

  const own = resolve("walk", {
    views: {
      walk: (seconds: number) => ({
        position: [seconds, 0, 5],
        target: [seconds, 0, 0],
      }),
    },
    seconds: 3,
  });
  TestValidator.equals("own view", own.record.position, { x: 3, y: 0, z: 5 });
  TestValidator.error("own view with a switch", (): void => {
    resolve("walk@follow", {
      views: { walk: () => ({ position: [0, 0, 5], target: [0, 0, 0] }) },
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