import { TestValidator } from "@nestia/e2e";

import {
  crossedCorners,
  neighboursOf,
} from "../../../scripts/body-basis/bodyContactGeometry";
import type { IBodyContactPlane } from "../../../scripts/body-basis/bodyContactPlanes";
import type { IBodyStanding } from "../../../scripts/body-basis/solveBodyContact";
import { solveBodyContactBest } from "../../../scripts/body-basis/solveBodyContactBest";
import { createBodyContactPatchFixture } from "../internal/bodyContactPatchFixture";

/**
 * The best-of contact solver tries the surface rules and the separating
 * planes from one start and keeps the first attempt that parts the pair or,
 * failing all, the one with the fewest crossing corners left.
 *
 * The fixture is two 2 cm patches (see `createBodyContactPatchFixture`) whose
 * tent pierces the flat patch; the plane `z = -5 mm` with its normal up puts
 * the flat patch on the plus side.
 *
 * Scenarios:
 * 1. With a plane handed in, the pair is parted, nothing crosses afterwards,
 *    the rule is named with its rounds, and the moves and standing
 *    constraints are the winning attempt's.
 * 2. An already clear pair keeps the first rule after no round.
 * 3. A budget of a tenth of a millimetre parts nothing: the answer is
 *    unsolved and the rule names the crossing corners left.
 */
export const test_human_body_contact_best = (): void => {
  const fixture = createBodyContactPatchFixture();
  const near = neighboursOf(fixture.indices, fixture.vertices);
  const plane = (): IBodyContactPlane => ({
    point: [0, 0, -0.005],
    normal: [0, 0, 1],
  });
  const remaining = (positions: number[]) =>
    crossedCorners(positions, fixture.a, fixture.b).size +
    crossedCorners(positions, fixture.b, fixture.a).size;
  const clear = createBodyContactPatchFixture(3, -0.005);
  const budget = 0.05;

  // 1. plane handed in
  const bestPositions = fixture.positions.slice();
  const bestMoves = new Map<number, number[]>();
  const bestStanding = new Map<number, IBodyStanding[]>();
  const best = solveBodyContactBest(
    bestPositions,
    fixture.positions,
    bestMoves,
    near,
    fixture.a,
    fixture.b,
    budget,
    plane(),
    new Map(),
    bestStanding,
  );
  TestValidator.equals("the best attempt parts the pair", best.solved, true);
  TestValidator.equals("nothing crosses", remaining(bestPositions), 0);
  TestValidator.predicate("the rule is named", /^[a-z-]+@\d+$/.test(best.rule));
  TestValidator.predicate(
    "the moves are the winning attempt's",
    bestMoves.size > 0,
  );
  // 2. clear pair
  const untouched = solveBodyContactBest(
    clear.positions.slice(),
    clear.positions,
    new Map(),
    near,
    clear.a,
    clear.b,
    budget,
    null,
    new Map(),
  );
  TestValidator.equals("a clear pair keeps the first rule", untouched.rule, "surface@0");
  // 3. no rule parts it
  const hopeless = solveBodyContactBest(
    fixture.positions.slice(),
    fixture.positions,
    new Map(),
    near,
    fixture.a,
    fixture.b,
    0.0001,
    plane(),
    new Map(),
  );
  TestValidator.equals("nothing parts within a 0.1 mm budget", hopeless.solved, false);
  TestValidator.predicate(
    "the crossing corners left are named",
    /:\d+left$/.test(hopeless.rule),
  );
};
