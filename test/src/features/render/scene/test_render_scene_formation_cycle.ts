import {
  applyFormationCycleCadence,
  formationCycleCadence,
  formationCycleOf,
  sampleFormationCycleMatrix,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFormationCycleFixture } from "../../internal/createFormationCycleFixture";

/** Tolerance of the interpolated translation. */
const MATRIX_TOLERANCE: number = 1e-6;

/**
 * The formation cycle helpers sample a baked take and advance its clock.
 *
 * Scenarios:
 *
 * 1. `sampleFormationCycleMatrix` blends the two samples round the cycle: 0.25
 *    and 1.25 give a translation of 5, 0.5 gives 10 and 0.75 gives 5 again,
 *    since sample 1 blends back into sample 0.
 * 2. A part outside the cycle is refused.
 * 3. `formationCycleCadence` of a 4 m, 1 turn walking segment on a 2 m stride
 *    and a 2 s idle segment on a 4 s period advances 2 + 0.5 cycles, turns
 *    0.5, and ends on the take of the last segment; a segment without a known
 *    gait takes the fallback.
 * 4. `applyFormationCycleCadence` writes that take, advance and turn to the
 *    cycle's active take and uniforms.
 * 5. `formationCycleOf` reads the cycle an object carries, or null.
 */
export function test_render_scene_formation_cycle(): void {
  const cycle = createFormationCycleFixture();
  const shift = (position: number): number =>
    sampleFormationCycleMatrix(cycle, 0, position, cycle.takes.get("walk")).elements[12]!;
  for (const [position, expected] of [
    [0.25, 5],
    [1.25, 5],
    [0.5, 10],
    [0.75, 5],
  ] as const)
    TestValidator.predicate(
      `position ${position}`,
      Math.abs(shift(position) - expected) < MATRIX_TOLERANCE,
    );
  TestValidator.error("part out of range", (): void => {
    sampleFormationCycleMatrix(cycle, 1, 0);
  });

  const cadence = formationCycleCadence(cycle, [
    { gait: "walk", seconds: 2, distance: 4, turn: 1 },
    { gait: null, seconds: 2, distance: 0, turn: 0 },
  ]);
  TestValidator.equals(
    "cadence",
    [cadence.take.gait, cadence.advance, cadence.turn],
    ["idle", 2.5, 0.5],
  );
  const applied = applyFormationCycleCadence(cycle, [
    { gait: "walk", seconds: 2, distance: 4, turn: 1 },
  ]);
  TestValidator.equals(
    "applied",
    [
      cycle.active.gait,
      cycle.uniforms.automovieCycleAdvance.value,
      cycle.uniforms.automovieCycleTurn.value,
      applied.advance,
    ],
    ["walk", 2, 0.5, 2],
  );

  const object: THREE.Object3D = new THREE.Object3D();
  TestValidator.equals("none", formationCycleOf(object), null);
  object.userData.automovieFormationCycle = cycle;
  TestValidator.predicate("carried", formationCycleOf(object) === cycle);
}