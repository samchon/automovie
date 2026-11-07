import assert from "node:assert/strict";

import { CameraTrack } from "../../../../src/interactions/cinematography/CameraTrack";
import { polygonFilm } from "../../../internal/polygonFilm";

/**
 * The camera's resolved path meets the coverage targets.
 *
 * Scenarios, with the study's thresholds (docs/research/cinematography/
 * fight-coverage.md#targets): the camera moves for at least 60% of the film;
 * the mean interval between size changes before the finish lies between 2
 * and 8 s; the lens stays inside the ropes; from 143 s the size is the
 * finish view to the end.
 */
export function test_camera_track(): void {
  const { camera, cast } = polygonFilm();
  let moving = 0;
  const changes: number[] = [];
  for (let k = 1; k < camera.length; k++) {
    const a = camera[k - 1]!;
    const b = camera[k]!;
    if (Math.hypot(b.position.x - a.position.x, b.position.y - a.position.y, b.position.z - a.position.z) > 1e-4) moving++;
    if (b.size !== a.size && k * CameraTrack.STEP < 143) changes.push(k * CameraTrack.STEP);
    assert.ok(Math.max(Math.abs(b.position.x), Math.abs(b.position.z)) < cast.ring.half);
    if (k * CameraTrack.STEP >= 143.1) assert.equal(b.size, "finish");
  }
  assert.ok(moving / camera.length >= 0.6, `moving ${moving / camera.length}`);
  const mean = (changes[changes.length - 1]! - changes[0]!) / (changes.length - 1);
  assert.ok(mean >= 2 && mean <= 8, `mean size interval ${mean}`);
}
