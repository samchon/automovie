import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { recordFilmSamples } from "./recordFilmSamples";

/**
 * A moving subject is placed at every shutter sample, so its edge smears over
 * the distance it travels while the shutter is open.
 *
 * Scenarios:
 *
 * 1. A unit cube's leading edge moves along camera X at 2 m/s, 5 m in front of a
 *    camera with `fovY` 45° at 1280 × 720 and 24 fps. With `shutter: { angle:
 *    180 }` and `samples: 16` the interval is 1/48 s and the travel 0.04167 m,
 *    and 720 / (2 × 5 × tan 22.5°) = 173.8 pixels per metre gives a ramp of 7.2
 *    ± 1 pixels: the 16 recorded edge positions are evenly spaced and their
 *    extent plus one stratum is that ramp.
 * 2. Without a shutter every sample is placed at the frame's second: with only a
 *    lens focused on the edge, every sample sees the edge at one place, a ramp
 *    of at most one pixel.
 */
export async function test_unit_render_draw_film_shutter_blur(): Promise<void> {
  const cube: THREE.Object3D = new THREE.Object3D();
  const edge: (
    optics: Parameters<typeof recordFilmSamples>[0]["optics"],
  ) => Promise<number[]> = async (
    optics: Parameters<typeof recordFilmSamples>[0]["optics"],
  ): Promise<number[]> =>
    (
      await recordFilmSamples({
        optics,
        seconds: 1,
        fps: 24,
        fovY: 45,
        width: 1280,
        height: 720,
        place: (at: number): void => {
          cube.position.set(2 * at, 0, -5);
        },
        probe: (): THREE.Vector3[] => [
          new THREE.Vector3(cube.position.x + 0.5, 0, -5),
        ],
      })
    ).map((sample: { x: number; y: number }[]): number => sample[0]!.x);

  const blurred: number[] = await edge({
    ev100: 10,
    toneMapping: "none",
    samples: 16,
    shutter: { angle: 180 },
  });
  const extent: number = Math.max(...blurred) - Math.min(...blurred);
  const steps: number[] = blurred
    .slice(1)
    .map((value: number, index: number): number => value - blurred[index]!);
  TestValidator.predicate(
    "the edge ramps over the shutter's travel",
    blurred.length === 16 &&
      steps.every(
        (step: number): boolean => Math.abs(step - steps[0]!) < 1e-6,
      ) &&
      Math.abs((extent * 16) / 15 - 7.2) <= 1,
  );

  const sharp: number[] = await edge({
    ev100: 10,
    toneMapping: "none",
    samples: 4,
    lens: { fNumber: 2, focusDistance: 5 },
  });
  TestValidator.predicate(
    "without a shutter the edge stays put",
    Math.max(...sharp) - Math.min(...sharp) <= 1,
  );
}
