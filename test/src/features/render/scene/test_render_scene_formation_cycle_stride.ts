import { AutoMovieRenderFormationCycle } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `formationCycleStride` is the ground distance one stride of the planted
 * foot's track covers.
 *
 * Scenarios:
 *
 * 1. The lowest track (bottom 0) has a closed ground path of 4 m with half of
 *    its points on the ground, so one stride is 4 / 2 / 0.5 = 4 m, whatever the
 *    higher track does.
 * 2. No tracks, and a track that stays in one place, give 0.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify the lowest foot track, its four-meter closed path and planted fraction, and two zero-distance controls.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that stride follows the lowest track and that absent or stationary tracks return zero.
 * @evidence contracts/development/testing.md#independent-expectations Derives the expected 4 m stride from the fixture's four-meter closed path and half-planted samples, independently of the higher track.
 */
export function test_render_scene_formation_cycle_stride(): void {
  const point = (x: number, y: number, z: number): THREE.Vector3 =>
    new THREE.Vector3(x, y, z);
  const planted: THREE.Vector3[] = [
    point(0, 0, 0),
    point(1, 2, 0),
    point(2, 0, 0),
    point(1, 2, 0),
  ];
  const raised: THREE.Vector3[] = [point(0, 1, 0), point(9, 3, 9)];
  TestValidator.equals(
    "stride",
    AutoMovieRenderFormationCycle.formationCycleStride([raised, planted]),
    4,
  );
  TestValidator.equals("no tracks", AutoMovieRenderFormationCycle.formationCycleStride([]), 0);
  TestValidator.equals(
    "standing",
    AutoMovieRenderFormationCycle.formationCycleStride([[point(1, 0, 1), point(1, 1, 1)]]),
    0,
  );
}