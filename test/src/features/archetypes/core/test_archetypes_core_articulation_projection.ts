import {
  AutoMovieArchetypeArticulation,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/** Covers one rigid turn and successive contact placements at this metre scale. */
const PROJECT_ROUNDING: number = 128 * Number.EPSILON;

/**
 * Resolves coupled travel, carries a level pedal and isolates motion reads.
 *
 * Scenarios:
 *
 * 1. A reversible follower drives a quarter-turn crank. The carried pedal
 *    moves around it, lowers by its own travel and retains its orientation.
 * 2. A later empty state restores the normal pedal and two equivalent inputs
 *    for one degree of freedom refuse.
 * 3. A caller can modify a direct stationary motion, a slider's rotation and
 *    a prepared motion without changing a later read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the coupled drive, pedal frame, repeated-query, refusal and result-ownership cases.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public prepare and motion APIs with real in-memory contacts. Reads their motion and frame results before and after editing a returned record.
 * @evidence contracts/development/testing.md#independent-expectations The crank's quarter turn takes the pedal's positive X offset to negative Z. The vertical slide subtracts 0.25 metres. A fresh identity and the same admitted pose establish the caller-mutation controls.
 */
export function test_archetypes_core_articulation_projection(): void {
  const origin = AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 });
  const crank: IAutoMovieAffordance = {
    id: "crank",
    kind: "crank",
    frame: origin,
    extent: null,
    travel: 180,
  };
  const lever: IAutoMovieAffordance = {
    id: "lever",
    kind: "slider",
    frame: origin,
    extent: null,
    travel: 2,
    reverse: 2,
    follows: { id: crank.id, ratio: -1 / 64, reversible: true },
  };
  const pedal: IAutoMovieAffordance = {
    id: "pedal",
    kind: "pedal",
    frame: AutoMovieArchetypeFrame.upright({ x: 2, y: 1, z: 0 }),
    extent: null,
    travel: 0.5,
    rides: crank.id,
  };
  const held = AutoMovieArchetypeArticulation.prepare("fixture", {
    parts: [],
    affordances: [pedal, lever, crank],
  });
  const followerTravel: number = -45 / 32;
  const read = held(
    new Map([
      [lever.id, followerTravel],
      [pedal.id, 0.25],
    ]),
  );
  TestValidator.equals(
    "a negative follower travel resolves the positive 90-degree crank input",
    [read.travels.get(crank.id), read.travels.get(lever.id)],
    [90, followerTravel],
  );
  const frame = read.frame(pedal.id)!;
  TestValidator.predicate(
    "the spindle moves around the crank and the pedal lowers without tilting",
    vclose(frame.translation, { x: 0, y: 0.75, z: -2 }, PROJECT_ROUNDING) &&
      qclose(frame.rotation, origin.rotation, PROJECT_ROUNDING),
  );
  TestValidator.equals(
    "the later rest query uses the authored pedal origin",
    held(new Map()).frame(pedal.id),
    pedal.frame,
  );

  let refusal: unknown;
  try {
    held(
      new Map([
        [crank.id, 90],
        [lever.id, followerTravel],
      ]),
    );
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "even equivalent inputs cannot drive one coupled degree twice",
    refusal instanceof AutoMovieArchetypeRefusal &&
      refusal.kind === "articulation" &&
      refusal.axis === lever.id,
  );

  const fixed: IAutoMovieAffordance = {
    id: "fixed",
    kind: "socket",
    frame: origin,
    extent: null,
  };
  const failures: string[] = [];
  const still: AutoMovieArchetypeFrame.IMotion =
    AutoMovieArchetypeArticulation.motion(fixed, 0);
  const restX: number = still.translation.x;
  try {
    still.translation.x = 5;
    if (AutoMovieArchetypeArticulation.motion(fixed, 0).translation.x !== 0)
      failures.push("a returned stationary motion changes the next motion");
  } finally {
    still.translation.x = restX;
  }

  const slide: AutoMovieArchetypeFrame.IMotion =
    AutoMovieArchetypeArticulation.motion(lever, 1);
  const restW: number = slide.rotation.w;
  try {
    slide.rotation.w = 0;
    if (AutoMovieArchetypeArticulation.motion(lever, 1).rotation.w !== 1)
      failures.push("a returned slider rotation changes the next motion");
  } finally {
    slide.rotation.w = restW;
  }

  const projected: AutoMovieArchetypeFrame.IMotion = read.motion(pedal);
  const projectedX: number = projected.translation.x;
  try {
    projected.translation.x += 1;
    if (!vclose(read.frame(pedal.id)!.translation, frame.translation, PROJECT_ROUNDING))
      failures.push("a returned motion changes the prepared frame");
  } finally {
    projected.translation.x = projectedX;
  }
  TestValidator.equals("mutating a read never changes its source", failures, []);
}
