import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { recordFilmSamples } from "./recordFilmSamples";

/**
 * A lens sample's eye moves across the aperture so a point off the focus plane
 * spreads into a disc the size of the thin-lens circle of confusion.
 *
 * Scenarios:
 *
 * 1. With `fovY = 2 atan(12 / 50)` (a 50 mm full-frame lens), `lens: { fNumber: 2,
 *    focusDistance: 2 }`, 64 samples and a 1280 × 720 raster, a point 4 m ahead
 *    lands on a disc 9.6 ± 1.5 pixels across: c = (50 / 2) × (|4000 − 2000| /
 *    4000) × 50 / (2000 − 50) = 0.3205 mm on a 24 mm gate, 9.6 pixels.
 * 2. The disc is centred on the sharp projection within a pixel, so the blur does
 *    not shift the subject.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Records where each sample's sheared camera projects the point; an aperture from the authored focal length, a radius instead of a diameter, or an unsheared eye changes the disc by more than the tolerance.
 * @evidence contracts/development/testing.md#independent-expectations The expected diameter is the issue's thin-lens circle of confusion (Potmesil and Chakravarty 1981); the pinhole shear model gives 9.375 pixels, inside its 1.5-pixel tolerance, and the Hammersley set's point 0 lies on the aperture's rim, so the recorded extent reaches the full diameter.
 * @evidence contracts/development/testing.md#distinguishing-cases A point behind the focus plane; the focus plane itself belongs to test_draw_film_lens_focus_plane and the permutation to test_draw_film_lens_shutter_permutation. The rasterised disc on the GPU is judged in a delivery capture.
 * @evidence contracts/development/testing.md#execution-ownership Portable CPU unit test; the stage is a recording double and no GPU starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios with the lens and the expected disc.
 */
export async function test_draw_film_lens_blur(): Promise<void> {
  const fovY: number = (2 * Math.atan(12 / 50) * 180) / Math.PI;
  const samples: { x: number; y: number }[][] = await recordFilmSamples({
    optics: {
      ev100: 10,
      toneMapping: "none",
      samples: 64,
      lens: { fNumber: 2, focusDistance: 2 },
    },
    seconds: 1,
    fps: 24,
    fovY,
    width: 1280,
    height: 720,
    place: (): void => {},
    probe: (): THREE.Vector3[] => [new THREE.Vector3(0, 0, -4)],
  });
  const points: { x: number; y: number }[] = samples.map(
    (sample: { x: number; y: number }[]): { x: number; y: number } =>
      sample[0]!,
  );
  const diameter: number = Math.max(
    ...points.flatMap((a: { x: number; y: number }): number[] =>
      points.map((b: { x: number; y: number }): number =>
        Math.hypot(a.x - b.x, a.y - b.y),
      ),
    ),
  );
  TestValidator.predicate(
    "the out-of-focus point spreads over the circle of confusion",
    points.length === 64 && Math.abs(diameter - 9.6) <= 1.5,
  );
  const mean: { x: number; y: number } = points.reduce(
    (sum: { x: number; y: number }, point: { x: number; y: number }) => ({
      x: sum.x + point.x / points.length,
      y: sum.y + point.y / points.length,
    }),
    { x: 0, y: 0 },
  );
  TestValidator.predicate(
    "the disc is centred on the sharp projection",
    Math.hypot(mean.x - 640, mean.y - 360) <= 1,
  );
}
