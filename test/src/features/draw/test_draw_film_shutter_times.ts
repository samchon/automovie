import { planAutoMovieFilmSamples } from "@automovie/engine";
import type {
  IAutoMovieFilmOptics,
  IAutoMoviePlanFilmSamples,
} from "@automovie/interface";
import { accumulateAutoMovieFilmSamples } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/nclose";
import { createFilmResponseRendererDouble } from "./createFilmResponseRendererDouble";

/**
 * A frame's shutter samples are placed at the midpoints of equal strata of the
 * trailing shutter interval, in ascending time, and the frame's own second is
 * placed last.
 *
 * Scenarios:
 *
 * 1. With `samples: 4`, `angle: 180` and 24 fps at t = 1, the planned seconds are
 *    1 − (1/48) × (3.5, 2.5, 1.5, 0.5) / 4, ascending, and repeating the plan
 *    gives the same seconds.
 * 2. Drawing that frame through `accumulateAutoMovieFilmSamples` places the scene
 *    at those four seconds, then at 1; the stage receives indices 0 to 3, each
 *    with a count of 4, and the camera resolved at each sample's second.
 * 3. A lens without a shutter places every sample at t, so the recorded placements
 *    are five times 1.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the engine planner and the render loop with a recording seek and stage; a leading interval, descending order, a missing final placement or a wrong count fails.
 * @evidence contracts/development/testing.md#independent-expectations The seconds are the issue's closed form; the trailing interval is 180/360/24 = 1/48 s.
 * @evidence contracts/development/testing.md#distinguishing-cases A shutter frame and a lens-only frame. The rendered blur width belongs to test_draw_film_shutter_blur and the lens geometry to test_draw_film_lens_blur.
 * @evidence contracts/development/testing.md#execution-ownership Portable CPU unit test; the stage is a recording double and no GPU starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios with their optics and expected placements.
 */
export async function test_draw_film_shutter_times(): Promise<void> {
  const optics: IAutoMovieFilmOptics = {
    ev100: 10,
    toneMapping: "none",
    samples: 4,
    shutter: { angle: 180 },
  };
  const expected: number[] = [3.5, 2.5, 1.5, 0.5].map(
    (stratum: number): number => 1 - ((1 / 48) * stratum) / 4,
  );
  const seconds: (samples: IAutoMoviePlanFilmSamples.ISample[]) => number[] = (
    samples: IAutoMoviePlanFilmSamples.ISample[],
  ): number[] =>
    samples.map(
      (sample: IAutoMoviePlanFilmSamples.ISample): number => sample.seconds,
    );
  const plan: IAutoMoviePlanFilmSamples.ISample[] = planAutoMovieFilmSamples({
    seconds: 1,
    fps: 24,
    optics,
    fovY: 45,
  });
  TestValidator.predicate(
    "the strata midpoints of the trailing interval, ascending and repeatable",
    seconds(plan).every((value: number, index: number): boolean =>
      nclose(value, expected[index]!, 1e-12),
    ) &&
      JSON.stringify(seconds(plan)) ===
        JSON.stringify(
          seconds(
            planAutoMovieFilmSamples({ seconds: 1, fps: 24, optics, fovY: 45 }),
          ),
        ),
  );

  const record: (frame: IAutoMovieFilmOptics) => Promise<{
    placed: number[];
    drawn: [number, number, number][];
  }> = async (
    frame: IAutoMovieFilmOptics,
  ): Promise<{ placed: number[]; drawn: [number, number, number][] }> => {
    const placed: number[] = [];
    const drawn: [number, number, number][] = [];
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
          drawn.push([
            props.index,
            props.count,
            props.camera.userData.at as number,
          ]);
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
        camera.userData.at = at;
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
