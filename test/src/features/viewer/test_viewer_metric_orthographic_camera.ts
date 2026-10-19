import { createAutoMovieMetricOrthographicCamera } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/nclose";

/**
 * Native calibrated projection preserves physical pixel charts and inverse rays.
 *
 * Scenarios:
 * 1. Multiple azimuths, noncentral principal points and unequal image dimensions project independent world points correctly at ordinary and tiny positive camera distances.
 * 2. Native inverse projection returns the same pixel and parallel viewing direction at different depths.
 * 3. Invalid pitch, sparse principal points, collapsed frusta and unordered depth limits refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds actual native orthographic cameras and uses native project/unproject transforms to assert pixel coordinates and inverse-ray consistency, rather than comparing implementation matrices to themselves.
 * @evidence contracts/testing.md#independent-expectations The declared affine chart independently fixes U=u0+(cos(a)X+sin(a)Z)/pitch and V=v0-Y/pitch. Parallel rays and equality of projected pixels at different depths follow from orthographic image formation.
 * @evidence contracts/testing.md#distinguishing-cases Covers cardinal/opposite/oblique angles, off-centre principal point, physical offsets, unequal viewport sides, inverse near/far samples, sparse/nonfinite/zero numeric admission and finite-frustum overflow. GPU pixel alignment is qualified separately on the actual host.
 * @evidence contracts/testing.md#execution-ownership This portable test_viewer_metric_orthographic_camera entry uses CPU native camera/vector algebra without a renderer, browser, GPU, file, native artifact or Human source.
 */
export function test_viewer_metric_orthographic_camera(): void {
  const base: Parameters<typeof createAutoMovieMetricOrthographicCamera>[0] = {
    width: 320,
    height: 240,
    pixelPitchMeters: 0.0004,
    principalPointPx: [133, 201],
    azimuthRadians: 0,
    distanceMeters: 1,
    nearMeters: 0.01,
    farMeters: 2,
  };
  for (const sample of [1, 1e-200].flatMap(
    (distance: number): { distance: number; angle: number }[] =>
      [0, Math.PI / 2, Math.PI, 0.37, -1.13].map(
        (angle: number): { distance: number; angle: number } => ({ distance, angle }),
      ),
  )) {
    const angle: number = sample.angle;
    const camera: THREE.OrthographicCamera =
      createAutoMovieMetricOrthographicCamera({
        ...base,
        distanceMeters: sample.distance,
        azimuthRadians: angle,
      });
    for (const point of [
      [0, 0, 0],
      [0.012, 0.033, -0.008],
      [-0.02, -0.011, 0.017],
    ]) {
      const ndc: THREE.Vector3 = new THREE.Vector3(
        point[0],
        point[1],
        point[2],
      ).project(camera);
      const u: number = ((ndc.x + 1) * base.width) / 2,
        v: number = ((1 - ndc.y) * base.height) / 2;
      TestValidator.predicate(
        "native pixels preserve metric chart",
        nclose(
          u,
          base.principalPointPx[0] +
            (Math.cos(angle) * point[0] + Math.sin(angle) * point[2]) /
              base.pixelPitchMeters,
          1e-9,
        ) &&
          nclose(
            v,
            base.principalPointPx[1] - point[1] / base.pixelPitchMeters,
            1e-9,
          ),
      );
      const a: THREE.Vector3 = new THREE.Vector3(ndc.x, ndc.y, -0.7).unproject(
          camera,
        ),
        b: THREE.Vector3 = new THREE.Vector3(ndc.x, ndc.y, 0.6).unproject(
          camera,
        );
      const ray: THREE.Vector3 = b.clone().sub(a).normalize();
      TestValidator.predicate(
        "inverse rays preserve horizontal parallel direction",
        nclose(ray.y, 0, 1e-12) &&
          nclose(
            ray.dot(new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle))),
            -1,
            1e-12,
          ),
      );
      TestValidator.predicate(
        "inverse depth leaves pixels unchanged",
        nclose(a.project(camera).x, ndc.x, 1e-12) &&
          nclose(b.project(camera).y, ndc.y, 1e-12),
      );
    }
  }
  const sparse: Parameters<typeof createAutoMovieMetricOrthographicCamera>[0] =
    { ...base, principalPointPx: [133, 201] };
  const tuple: number[] = sparse.principalPointPx;
  Reflect.deleteProperty(tuple, "0");
  for (const input of [
    { ...base, pixelPitchMeters: 0 },
    { ...base, farMeters: base.nearMeters },
    { ...base, azimuthRadians: NaN },
    { ...base, pixelPitchMeters: 1e308 },
    sparse,
  ]) {
    let refused: boolean = false;
    try {
      createAutoMovieMetricOrthographicCamera(input);
    } catch {
      refused = true;
    }
    TestValidator.predicate("invalid camera admission refuses", refused);
  }
}
