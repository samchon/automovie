import type { IAutoMovieRecoveryCameraView } from "@automovie/interface";
import { createRecoveryCameraChart } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Every reciprocal, product and sum in this skewed chart is a small dyadic fraction. */
const EXACT_DYADIC_TOLERANCE: number = 0;

/**
 * A resident chart builds the skewed calibration and its analytic inverse.
 *
 * Scenarios:
 *
 * 1. The map u = 4x + 2y + 2 and v = 8y − 1 implies y = v/8 + 1/8 and
 *    x = u/4 − v/16 − 9/16. Both matrices are exact.
 * 2. A principal offset of 2⁶⁰ elides a one-pixel difference and refuses.
 *    A zero focal length cannot be inverted and also refuses.
 */
export function test_unit_recovery_internal_create_camera_chart(): void {
  const view: IAutoMovieRecoveryCameraView = {
    id: "analytic skewed chart",
    sourceSha256: "0".repeat(64),
    pixelProvenance: "synthetic resident chart",
    width: 2,
    height: 2,
    rgb8: new Uint8Array(12),
    camera: {
      type: "pinhole",
      calibration: "supplied-intrinsics",
      distortion: "caller-corrected",
      focalPx: [4, 8],
      skewPx: 2,
      principalPointPx: [2, -1],
      uncertaintyPx: null,
    },
  };
  const chart: ReturnType<typeof createRecoveryCameraChart> = createRecoveryCameraChart(view);
  TestValidator.predicate("core K entries", chart.matrix.length === 9 && chart.matrix.every((value: number, index: number): boolean => nclose(value, [4, 2, 2, 0, 8, -1, 0, 0, 1][index]!, EXACT_DYADIC_TOLERANCE)));
  TestValidator.predicate("inverse skew and offsets", chart.inverse.length === 9 && chart.inverse.every((value: number, index: number): boolean => nclose(value, [1 / 4, -1 / 16, -9 / 16, 0, 1 / 8, 1 / 8, 0, 0, 1][index]!, EXACT_DYADIC_TOLERANCE)));
  TestValidator.error("rounded-away pixel increment", (): unknown => createRecoveryCameraChart({...view, camera: {...view.camera, principalPointPx: [2 ** 60, 0]}}));
  TestValidator.error("zero focal length", (): unknown => createRecoveryCameraChart({...view, camera: {...view.camera, focalPx: [0, 8]}}));
}
