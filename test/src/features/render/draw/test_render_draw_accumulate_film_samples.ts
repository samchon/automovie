import type { IAutoMovieFilmOptics } from "@automovie/interface";
import { accumulateAutoMovieFilmSamples } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFilmResponseRendererDouble } from "../../internal/createFilmResponseRendererDouble";
import { nclose } from "../../internal/nclose";

/**
 * A frame's shutter samples are placed at the midpoints of equal strata of the
 * trailing shutter interval, in ascending time, and the frame's own second is
 * placed last.
 *
 * Scenarios:
 *
 * 1. With `samples: 4`, `angle: 180` and 24 fps at t = 1, the scene is placed at 1
 *    − (1/48) × (3.5, 2.5, 1.5, 0.5) / 4, ascending, then at 1; the stage
 *    receives indices 0 to 3, each with a count of 4, and the camera resolved
 *    at each sample's second.
 * 2. A lens without a shutter places every sample at t, so the recorded placements
 *    are five times 1.
 */
export async function test_render_draw_accumulate_film_samples(): Promise<void> {
  const optics: IAutoMovieFilmOptics = {
    ev100: 10,
    toneMapping: "none",
    samples: 4,
    shutter: { angle: 180 },
  };
  const expected: number[] = [3.5, 2.5, 1.5, 0.5].map(
    (stratum: number): number => 1 - ((1 / 48) * stratum) / 4,
  );

  const record: (frame: IAutoMovieFilmOptics) => Promise<{
    placed: number[];
    drawn: [number, number, number][];
  }> = async (
    frame: IAutoMovieFilmOptics,
  ): Promise<{ placed: number[]; drawn: [number, number, number][] }> => {
    const placed: number[] = [];
    const drawn: [number, number, number][] = [];
    let resolved: number = -1;
    const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
      45,
      16 / 9,
      0.1,
      100,
    );
    await accumulateAutoMovieFilmSamples({
      stage: {
        accumulate: (props: {
          index: number;
          count: number;
          camera: THREE.Camera;
        }): void => {
          drawn.push([props.index, props.count, resolved]);
        },
      },
      renderer: createFilmResponseRendererDouble({
        toneMapping: THREE.NoToneMapping,
        exposure: 1,
      }).renderer,
      scene: new THREE.Scene(),
      optics: frame,
      seconds: 1,
      fps: 24,
      fovY: 45,
      width: 64,
      height: 36,
      seek: async (at: number): Promise<void> => {
        placed.push(at);
      },
      camera: (at: number): THREE.Camera => {
        resolved = at;
        return camera;
      },
      scratch: new THREE.PerspectiveCamera(),
    });
    return { placed, drawn };
  };

  const shutter: { placed: number[]; drawn: [number, number, number][] } =
    await record(optics);
  TestValidator.predicate(
    "the samples are placed in order, then the frame's second",
    shutter.placed.length === 5 &&
      shutter.placed
        .slice(0, 4)
        .every((value: number, index: number): boolean =>
          nclose(value, expected[index]!, 1e-12),
        ) &&
      shutter.placed[4] === 1,
  );
  TestValidator.predicate(
    "each sample is drawn through the camera resolved at its second",
    shutter.drawn.length === 4 &&
      shutter.drawn.every(
        ([index, count, at]: [number, number, number]): boolean =>
          count === 4 && nclose(at, expected[index]!, 1e-12),
      ) &&
      shutter.drawn
        .map(([index]: [number, number, number]): number => index)
        .join() === "0,1,2,3",
  );

  const still: { placed: number[] } = await record({
    ev100: 10,
    toneMapping: "none",
    samples: 4,
    lens: { fNumber: 2, focusDistance: 3 },
  });
  TestValidator.equals(
    "a lens alone samples the frame's second",
    still.placed,
    [1, 1, 1, 1, 1],
  );
}
