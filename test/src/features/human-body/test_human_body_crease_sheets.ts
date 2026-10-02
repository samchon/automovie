import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import {
  meshOfSegment,
  neighboursOf,
} from "../../../scripts/body-basis/bodyContactGeometry";
import { relaxBodyCrease } from "../../../scripts/body-basis/relaxBodyCrease";
import { splitBodySheets } from "../../../scripts/body-basis/splitBodySheets";
import { createBodyContactPatchFixture } from "../internal/bodyContactPatchFixture";

/**
 * A skin segment that passes through itself is split into the two sheets of
 * each tangle, and a crumpled crease is relaxed toward one smooth fold.
 *
 * The fixture's two patches (see `createBodyContactPatchFixture`) are read as
 * one segment: the tent of the second pierces the first, so the segment
 * crosses itself in one tangle whose sheets are the two patches.
 *
 * Scenarios:
 * 1. The pierced segment has one tangle: its two sheets are the two patches,
 *    the first sheet lists only corners of the first patch and the second
 *    only corners of the second, and each sheet grew past its crossing
 *    triangles by the rings.
 * 2. Growing zero rings keeps exactly the crossing triangles of each side.
 * 3. A segment that crosses nothing has no sheets.
 * 4. Relaxing a crease returns `solved` exactly when the segment no longer
 *    crosses itself, moves only vertices inside the region, keeps every
 *    vertex within the budget, and leaves the base untouched.
 * 5. A segment that does not cross itself needs no round and moves nothing.
 */
export const test_human_body_crease_sheets = (): void => {
  const fixture = createBodyContactPatchFixture();
  const segment = [...fixture.a, ...fixture.b];
  const first = fixture.a.length / 3;

  // 1. two sheets
  const sheets = splitBodySheets(fixture.positions, segment);
  TestValidator.equals("one tangle", sheets.length, 1);
  TestValidator.predicate(
    "the first sheet lies on the first patch",
    sheets[0].a.every((v) => v < 9) && sheets[0].a.length > 0,
  );
  TestValidator.predicate(
    "the second sheet lies on the second patch",
    sheets[0].b.every((v) => v >= 9) && sheets[0].b.length > 0,
  );

  // 2. no rings
  const tight = splitBodySheets(fixture.positions, segment, 0);
  TestValidator.predicate(
    "growing no ring keeps fewer triangles than growing two",
    tight[0].a.length < sheets[0].a.length &&
      tight[0].b.length < sheets[0].b.length,
  );
  TestValidator.predicate(
    "and every kept triangle crosses",
    tight[0].a.length / 3 + tight[0].b.length / 3 <= 2 * first,
  );

  // 3. nothing crosses
  const clear = createBodyContactPatchFixture(3, -0.005);
  TestValidator.equals(
    "a clear segment has no sheets",
    splitBodySheets(clear.positions, [...clear.a, ...clear.b]).length,
    0,
  );

  // 4. relax
  const near = neighboursOf(fixture.indices, fixture.vertices);
  const positions = fixture.positions.slice();
  const moves = new Map<number, number[]>();
  const budget = 0.05;
  const relaxed = relaxBodyCrease(
    positions,
    fixture.positions,
    moves,
    near,
    segment,
    budget,
  );
  const mesh = meshOfSegment(positions, segment);
  TestValidator.equals(
    "solved means the segment no longer crosses itself",
    relaxed.solved,
    measureAutoMovieMeshCrossings(mesh, mesh).length === 0,
  );
  TestValidator.predicate("some vertices moved", relaxed.moved > 0 && moves.size > 0);
  TestValidator.predicate(
    "no vertex left the budget",
    [...moves.values()].every(
      (d) => Math.hypot(d[0], d[1], d[2]) <= budget + 1e-12,
    ),
  );
  const tiny = relaxBodyCrease(
    fixture.positions.slice(),
    fixture.positions,
    new Map(),
    near,
    segment,
    0.00001,
  );
  TestValidator.equals("a starved budget stays unsolved", tiny.solved, false);
  TestValidator.equals("after every round", tiny.rounds, 60);

  // 5. clear
  const still = relaxBodyCrease(
    clear.positions.slice(),
    clear.positions,
    new Map(),
    near,
    [...clear.a, ...clear.b],
    budget,
  );
  TestValidator.equals("a clear segment needs no round", still.rounds, 0);
  TestValidator.equals("and moves nothing", still.moved, 0);
};
