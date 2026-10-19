import { updateAutoMovieComparisonCamera } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/nclose";

/**
 * Paired inspection preserves equal projection at oblique and profile views.
 *
 * Scenarios:
 * 1. Cardinal, opposite, high and low oblique cameras retain one parallel chart.
 * 2. Identical points separated along screen-right have equal vertical pixels and constant horizontal separation at different depths.
 * 3. Stale output zoom/view offsets are reset; invalid dimensions, source lenses, manual matrices, parent/scale transforms and collapsed charts refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Updates actual native orthographic cameras and projects independently authored points under both display offsets. Constant projected separation and equal vertical coordinates must hold at every tested depth and view.
 * @evidence contracts/testing.md#independent-expectations Parallel projection is affine: opposite horizontal offsets of magnitude d change NDC X by 2d/halfWidth and leave Y unchanged. Analytic camera azimuth independently fixes right as (cos(a),0,-sin(a)); target-plane height follows distance times tan(fov/2).
 * @evidence contracts/testing.md#distinguishing-cases Covers front/profile/opposite/high/low views, unequal viewport sides, translated frame origins, different point depths and stale output lens state. Zero/nonfinite separation, nonpositive aspect, invalid target, source lens offsets, manual matrices, parent/scale transforms and extreme inverse collapse refuse; actual GPU appearance is a separate complete inspection round.
 * @evidence contracts/testing.md#execution-ownership This portable test_viewer_comparison_camera entry owns native CPU cameras/vectors only, without a browser, renderer, process, filesystem, native build, foreign replacement or Human source.
 */
export function test_viewer_comparison_camera(): void {
  const target: THREE.Vector3 = new THREE.Vector3(0.012, 0.05, -0.007);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    35,
    1.2,
    0.001,
    2,
  );
  const comparison: THREE.OrthographicCamera = new THREE.OrthographicCamera();
  comparison.zoom = 2;
  comparison.setViewOffset(128, 128, 0, 0, 64, 128);
  const offset: THREE.Vector3 = new THREE.Vector3();
  for (const view of [
    [0, 0],
    [90, 0],
    [215, 20],
    [135, 55],
    [315, -35],
  ]) {
    const a: number = (view[0] * Math.PI) / 180,
      e: number = (view[1] * Math.PI) / 180;
    camera.position.set(
      target.x + 0.3 * Math.cos(e) * Math.sin(a),
      target.y + 0.3 * Math.sin(e),
      target.z + 0.3 * Math.cos(e) * Math.cos(a),
    );
    camera.lookAt(target);
    updateAutoMovieComparisonCamera({
      perspective: camera,
      comparison,
      target,
      halfSeparation: 0.04,
      offset,
    });
    TestValidator.predicate(
      "parallel chart preserves target-plane scale and horizontal basis",
      nclose(comparison.top, 0.3 * Math.tan((35 * Math.PI) / 360), 1e-12) &&
        nclose(
          comparison.right,
          0.36 * Math.tan((35 * Math.PI) / 360),
          1e-12,
        ) &&
        comparison.zoom === 1 &&
        comparison.view?.enabled !== true &&
        nclose(offset.x, 0.04 * Math.cos(a), 1e-12) &&
        nclose(offset.y, 0, 1e-12) &&
        nclose(offset.z, -0.04 * Math.sin(a), 1e-12),
    );
    for (const xyz of [
      [-0.01, 0.01, 0.005],
      [0.015, 0.09, -0.009],
      [0.012, 0.05, -0.007],
    ]) {
      const point: THREE.Vector3 = new THREE.Vector3(xyz[0], xyz[1], xyz[2]);
      const left: THREE.Vector3 = point.clone().sub(offset).project(comparison);
      const right: THREE.Vector3 = point
        .clone()
        .add(offset)
        .project(comparison);
      TestValidator.predicate(
        "matched views keep equal vertical and constant horizontal projection",
        nclose(left.y, right.y, 1e-12) &&
          nclose(
            right.x - left.x,
            0.08 / (0.36 * Math.tan((35 * Math.PI) / 360)),
            1e-12,
          ),
      );
    }
  }
  for (const change of [
    "aspect",
    "target",
    "separation",
    "zero-separation",
    "parent",
    "scale",
    "manual",
    "lens",
    "view",
    "output-parent",
    "output-scale",
    "output-manual",
    "gauge",
  ]) {
    const source: THREE.PerspectiveCamera = camera.clone();
    const destination: THREE.OrthographicCamera = comparison.clone();
    const frame: THREE.Vector3 = target.clone();
    if (change === "aspect") source.aspect = 0;
    if (change === "target") frame.x = NaN;
    if (change === "parent") new THREE.Group().add(source);
    if (change === "scale") source.scale.x = 2;
    if (change === "manual") source.matrixAutoUpdate = false;
    if (change === "lens") source.filmOffset = 1;
    if (change === "view") source.setViewOffset(128, 128, 1, 0, 64, 128);
    if (change === "output-parent") new THREE.Group().add(destination);
    if (change === "output-scale") destination.scale.y = 2;
    if (change === "output-manual") destination.matrixAutoUpdate = false;
    if (change === "gauge") {
      source.position.set(0, 0, 1e110);
      source.near = 1;
      source.far = 1e110;
    }
    let refused: boolean = false;
    try {
      updateAutoMovieComparisonCamera({
        perspective: source,
        comparison: destination,
        target: frame,
        halfSeparation:
          change === "separation"
            ? NaN
            : change === "zero-separation"
              ? 0
              : 0.04,
        offset,
      });
    } catch {
      refused = true;
    }
    TestValidator.predicate("unsupported comparison chart refuses", refused);
  }
}
