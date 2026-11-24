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
 */
export async function test_unit_render_draw_film_lens_focus_plane(): Promise<void> {
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
