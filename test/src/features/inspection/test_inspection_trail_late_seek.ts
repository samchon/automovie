import {
  type IAutoMovieInspectionTrail,
  sampleAutoMovieInspectionTrails,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * A trail is sampled at the seconds asked even when the subject places itself only after an await, because the sampler waits for every seek before reading, and a seek that fails fails the sampling.
 *
 * Scenarios:
 *
 * 1. A subject whose seek places an object at x = seconds only after a timer of a few milliseconds is sampled at 0, 1, 2 and 3: the trail reads 0, 1, 2 and 3 along X, not the place of the second before each.
 * 2. Its seeks never overlap: each starts after the previous one resolved, in ascending order of the seconds asked out of order.
 * 3. The scene is left where the last seek placed it, x = 3.
 * 4. A seek that rejects for one second rejects the sampling with that seek's own error.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Samples a scene through the public sampler with a subject double that resolves late and reads the trail's positions and the order of seeks; a sampler that read before the seek resolved would record each second's predecessor and fails scenario 1, one that overlapped seeks fails scenario 2.
 * @evidence contracts/development/testing.md#independent-expectations The expected positions are the authored motion of one metre per second along X at the asked seconds; the expected seek order is ascending, as the sampler documents.
 * @evidence contracts/development/testing.md#distinguishing-cases A late seek against a failing one, and seconds given out of order. Immediate seeks, stationary trails and refusals of patterns and times are owned by `test_inspection_motion`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_inspection_trail_late_seek`; it builds its own scene and timers and starts no browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_inspection_trail_late_seek(): Promise<void> {
  const mover: THREE.Mesh = InspectionScene.quad("mover", 0, 0.2);
  const stage: THREE.Scene = InspectionScene.scene(mover);
  const log: string[] = [];
  let busy: boolean = false;
  const late: (seconds: number) => Promise<void> = async (
    seconds: number,
  ): Promise<void> => {
    if (busy) log.push("overlap");
    busy = true;
    log.push(`start ${seconds}`);
    await new Promise((resolve: (value: unknown) => void): void => {
      setTimeout(resolve, 4);
    });
    mover.position.set(seconds, 0, 0);
    log.push(`placed ${seconds}`);
    busy = false;
  };

  // 1. Positions at the asked seconds.
  const [trail]: IAutoMovieInspectionTrail[] =
    await sampleAutoMovieInspectionTrails({
      scene: stage,
      pattern: "mover",
      times: [2, 0, 3, 1],
      seek: late,
    });
  TestValidator.equals(
    "the asked seconds along X",
    [trail!.times, trail!.positions],
    [
      [0, 1, 2, 3],
      [0, 0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0],
    ],
  );

  // 2. One seek at a time, ascending.
  TestValidator.equals("seeks in order, never overlapping", log, [
    "start 0",
    "placed 0",
    "start 1",
    "placed 1",
    "start 2",
    "placed 2",
    "start 3",
    "placed 3",
  ]);

  // 3. Left at the last second.
  TestValidator.equals("left at the last seek", mover.position.x, 3);

  // 4. A failing seek.
  const failing: (seconds: number) => Promise<void> = async (
    seconds: number,
  ): Promise<void> => {
    if (seconds === 1) throw new Error("no pose at 1 s");
    mover.position.set(seconds, 0, 0);
  };
  const message: string = await sampleAutoMovieInspectionTrails({
    scene: stage,
    pattern: "mover",
    times: [0, 1, 2],
    seek: failing,
  })
    .then((): string => "")
    .catch((error: unknown): string =>
      error instanceof Error ? error.message : String(error),
    );
  TestValidator.equals("the seek's own error", message, "no pose at 1 s");
}
