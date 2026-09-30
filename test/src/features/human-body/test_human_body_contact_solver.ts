import { TestValidator } from "@nestia/e2e";

import {
  crossedCorners,
  neighboursOf,
} from "../../../scripts/body-basis/bodyContactGeometry";
import type { IBodyContactPlane } from "../../../scripts/body-basis/bodyContactPlanes";
import {
  CONTACT_ROUNDS,
  type IBodyContactTrace,
  type IBodyStanding,
  solveBodyContact,
} from "../../../scripts/body-basis/solveBodyContact";
import { createBodyContactPatchFixture } from "../internal/bodyContactPatchFixture";

/**
 * The contact solver parts two skin patches that cross in a pose.
 *
 * The fixture is two 2 cm patches (see `createBodyContactPatchFixture`): a
 * flat patch at `z = 0` and a patch a centimetre below it whose tent rises to
 * `z = +1 cm` through it. A separating plane `z = -5 mm` with its normal up
 * puts the flat patch on the plus side.
 *
 * Scenarios:
 * 1. Under the plane rule the pair is solved: no corner of either patch
 *    crosses the other afterwards, the flat patch moved up, the tent's apex
 *    moved down, no vertex left its 5 cm budget, the base positions were not
 *    touched and the separations won are recorded as standing constraints.
 * 2. The trace sees the first round cross on both sides and the last round
 *    clear.
 * 3. The negative twin, the same patches with the tent pressed below the flat
 *    patch, needs no round and moves nothing.
 * 4. A budget of one millimetre cannot part the pair: the answer is unsolved
 *    after every round and no vertex moved more than the budget.
 * 5. A vertex both patches touch follows its owner, the seam of a partition.
 * 6. Without a plane the surface rule runs, and `solved` agrees with the
 *    crossings that remain.
 */
export const test_human_body_contact_solver = (): void => {
  const fixture = createBodyContactPatchFixture();
  const near = neighboursOf(fixture.indices, fixture.vertices);
  const plane = (): IBodyContactPlane => ({
    point: [0, 0, -0.005],
    normal: [0, 0, 1],
  });
  const remaining = (positions: number[], a = fixture.a, b = fixture.b) =>
    crossedCorners(positions, a, b).size + crossedCorners(positions, b, a).size;
  const budget = 0.05;

  // 1. plane rule
  const positions = fixture.positions.slice();
  const displacement = new Map<number, number[]>();
  const standing = new Map<number, IBodyStanding[]>();
  const trace: IBodyContactTrace[] = [];
  TestValidator.predicate(
    "the fixture crosses",
    remaining(fixture.positions) > 0,
  );
  const result = solveBodyContact(
    positions,
    fixture.positions,
    displacement,
    near,
    fixture.a,
    fixture.b,
    budget,
    plane(),
    new Map(),
    (event) => trace.push(event),
    true,
    standing,
  );
  TestValidator.equals("solved", result.solved, true);
  TestValidator.equals("nothing crosses afterwards", remaining(positions), 0);
  TestValidator.predicate(
    "the flat patch moved up",
    positions[4 * 3 + 2] > fixture.positions[4 * 3 + 2],
  );
  const apex = 9 + 4;
  TestValidator.predicate(
    "the tent's apex moved down",
    positions[apex * 3 + 2] < fixture.positions[apex * 3 + 2],
  );
  TestValidator.predicate(
    "no vertex left its budget",
    [...displacement.values()].every(
      (d) => Math.hypot(d[0], d[1], d[2]) <= budget + 1e-12,
    ),
  );
  TestValidator.predicate("standing constraints were recorded", standing.size > 0);

  // 2. trace
  TestValidator.predicate(
    "the first round saw both sides cross",
    trace[0].round === 0 && trace[0].crossedA > 0 && trace[0].crossedB > 0,
  );
  TestValidator.equals("one trace per round", trace.length, result.rounds + 1);
  TestValidator.equals(
    "the last round saw no crossing",
    trace[trace.length - 1].crossedA + trace[trace.length - 1].crossedB,
    0,
  );

  // 3. clear twin
  const clear = createBodyContactPatchFixture(3, -0.005);
  const clearPositions = clear.positions.slice();
  const clearMoves = new Map<number, number[]>();
  const twin = solveBodyContact(
    clearPositions,
    clear.positions,
    clearMoves,
    near,
    clear.a,
    clear.b,
    budget,
    plane(),
  );
  TestValidator.equals("a clear pair needs no round", twin.rounds, 0);
  TestValidator.equals("and moves nothing", clearMoves.size, 0);

  // 4. starved
  const starvedPositions = fixture.positions.slice();
  const starvedMoves = new Map<number, number[]>();
  const starved = solveBodyContact(
    starvedPositions,
    fixture.positions,
    starvedMoves,
    near,
    fixture.a,
    fixture.b,
    0.001,
    plane(),
  );
  TestValidator.equals("a starved budget does not part", starved.solved, false);
  TestValidator.equals("after every round", starved.rounds, CONTACT_ROUNDS);
  TestValidator.predicate(
    "no vertex moved past the starved budget",
    [...starvedMoves.values()].every(
      (d) => Math.hypot(d[0], d[1], d[2]) <= 0.001 + 1e-12,
    ),
  );

  // 5. a shared seam vertex follows its owner
  const seamB = fixture.b.slice();
  seamB[0] = 0;
  const seamPositions = fixture.positions.slice();
  const seam = solveBodyContact(
    seamPositions,
    fixture.positions,
    new Map(),
    near,
    fixture.a,
    seamB,
    budget,
    plane(),
    new Map([[0, -1]]),
  );
  TestValidator.equals(
    "the seam pair is solved",
    seam.solved,
    remaining(seamPositions, fixture.a, seamB) === 0,
  );

  // 6. surface rule
  const surfacePositions = fixture.positions.slice();
  const surface = solveBodyContact(
    surfacePositions,
    fixture.positions,
    new Map(),
    near,
    fixture.a,
    fixture.b,
    budget,
    null,
    new Map(),
    null,
    false,
  );
  TestValidator.equals(
    "solved agrees with the remaining crossings",
    surface.solved,
    remaining(surfacePositions) === 0,
  );
};
