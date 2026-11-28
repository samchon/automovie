import type { IAutoMovieInspectionTrail } from "@automovie/interface";
import { AutoMovieRenderInspection } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";
import * as THREE from "three";

import { InspectionScene } from "../../internal/InspectionScene";

/**
 * A trail is sampled at the seconds asked even when the subject places itself
 * only after an await, because the sampler waits for every seek before reading,
 * and a seek that fails fails the sampling.
 *
 * Scenarios:
 *
 * 1. A subject whose seek places an object at x = seconds only after a timer of a
 *    few milliseconds is sampled at 0, 1, 2 and 3: the trail reads 0, 1, 2 and
 *    3 along X, not the place of the second before each.
 * 2. Its seeks never overlap: each starts after the previous one resolved, in
 *    ascending order of the seconds asked out of order.
 * 3. The scene is left where the last seek placed it, x = 3.
 * 4. A seek that rejects for one second rejects the sampling with that seek's own
 *    error.
 * 5. A nonfinite requested time is refused before any scene seek. A removed
 *    object and a same-named replacement form distinct segments. The same object
 *    under a replacement ancestor also starts another segment.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the sequential seek, refusal and object-identity cases.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public sampler with an in-memory scene, explicit seeks and a real removal and replacement.
 * @evidence contracts/development/testing.md#independent-expectations The subject is placed at the literal fixture second on the X axis. The original object is absent at one second and a new instance occupies its path at two and three seconds. The gap must supply no current witness. Replacing the named parent preserves the path while changing the frame reference.
 */
export async function test_render_scene_sample_inspection_trails(): Promise<void> {
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
    await AutoMovieRenderInspection.sampleTrails({
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
  const message: string = await AutoMovieRenderInspection.sampleTrails({
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

  let visited = 0;
  await assert.rejects(AutoMovieRenderInspection.sampleTrails({
    scene: stage, pattern: "mover", times: [0, NaN],
    seek: async () => { visited++; },
  }), /finite/u);
  assert.equal(visited, 0);

  const replacement = InspectionScene.quad("mover", 0, 0.2);
  const segments = await AutoMovieRenderInspection.sampleTrails({
    scene: stage, pattern: "mover", times: [0, 1, 2, 3],
    seek: async (seconds) => {
      if (seconds === 0) mover.position.set(0, 0, 0);
      else if (seconds === 1) stage.remove(mover);
      else {
        if (seconds === 2) stage.add(replacement);
        replacement.position.set(seconds, 0, 0);
      }
    },
  });
  assert.deepEqual(segments.map(({ times, positions }) => [times, positions]), [
    [[0], [0, 0, 0]], [[2, 3], [2, 0, 0, 3, 0, 0]],
  ]);
  assert(!AutoMovieRenderInspection.markTrails(segments, 1).some(({ kind }) => kind === "trail/now"));

  const firstParent = new THREE.Group();
  firstParent.name = "anchor";
  const secondParent = new THREE.Group();
  secondParent.name = "anchor";
  firstParent.add(replacement);
  stage.add(firstParent);
  const reparented = await AutoMovieRenderInspection.sampleTrails({
    scene: stage,
    pattern: "anchor/mover",
    times: [0, 1],
    seek: async (seconds) => {
      if (seconds === 1) {
        stage.remove(firstParent);
        stage.add(secondParent);
        secondParent.add(replacement);
      }
    },
  });
  assert.deepEqual(reparented.map(({ times }) => times), [[0], [1]]);
}
