import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { recordFilmSamples } from "./recordFilmSamples";

/**
 * The lens samples shear the frustum so the focus plane projects unchanged, and
 * a frame without a lens keeps every sample at the camera centre.
 *
 * Scenarios:
 *
 * 1. With `lens: { fNumber: 2, focusDistance: 2 }` and 64 samples, a point on the
 *    focus plane 2 m ahead, on axis and 0.4 m off axis, projects to the same
 *    pixel through every sample, within 0.001 pixels of the sharp projection.
 * 2. A frame with a shutter and no lens draws every sample through the unmoved
 *    camera, so a static point lands on one pixel.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Projects through each recorded sample camera; a shear of the wrong sign or scale, or an eye moved without the shear, moves the focus plane by pixels.
 * @evidence contracts/development/testing.md#independent-expectations The sharp projection is the pinhole camera's own, and the issue requires the focus plane to stay within a pixel of it; the closed form is exact, so the tolerance only absorbs rounding.
 * @evidence contracts/development/testing.md#distinguishing-cases On-axis and off-axis points on the plane, and a lensless frame. The out-of-focus disc belongs to test_draw_film_lens_blur.
 * @evidence contracts/development/testing.md#execution-ownership Portable CPU unit test; the stage is a recording double and no GPU starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios with the probe points and expected spread.
 */
export async function test_draw_film_lens_focus_plane(): Promise<void> {
  const probe: () => THREE.Vector3[] = (): THREE.Vector3[] => [
    new THREE.Vector3(0, 0, -2),
    new THREE.Vector3(0.4, -0.25, -2),
  ];
  const sharp: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    40,
    16 / 9,
    0.1,
    100,
  );
  sharp.updateMatrixWorld(true);
  const expected: { x: number; y: number }[] = probe().map(
    (point: THREE.Vector3): { x: number; y: number } => {
      const ndc: THREE.Vector3 = point.project(sharp);
      return { x: ((ndc.x + 1) / 2) * 1280, y: ((1 - ndc.y) / 2) * 720 };
    },
  );
  const lensed: { x: number; y: number }[][] = await recordFilmSamples({
    optics: {
      ev100: 10,
      toneMapping: "none",
      samples: 64,
      lens: { fNumber: 2, focusDistance: 2 },
    },
    seconds: 1,
    fps: 24,
    fovY: 40,
    width: 1280,
    height: 720,
    place: (): void => {},
    probe,
  });
  const steady: (samples: { x: number; y: number }[][]) => boolean = (
    samples: { x: number; y: number }[][],
  ): boolean =>
    samples.every((sample: { x: number; y: number }[]): boolean =>
      sample.every(
        (point: { x: number; y: number }, index: number): boolean =>
          Math.hypot(
            point.x - expected[index]!.x,
            point.y - expected[index]!.y,
          ) <= 0.001,
      ),
    );
  TestValidator.predicate(
    "the focus plane projects unchanged through every lens sample",
    lensed.length === 64 && steady(lensed),
  );
  const shuttered: { x: number; y: number }[][] = await recordFilmSamples({
    optics: {
      ev100: 10,
      toneMapping: "none",
      samples: 8,
      shutter: { angle: 180 },
    },
    seconds: 1,
    fps: 24,
    fovY: 40,
    width: 1280,
    height: 720,
    place: (): void => {},
    probe,
  });
  TestValidator.predicate(
    "without a lens the camera is not moved",
    shuttered.length === 8 && steady(shuttered),
  );
}
