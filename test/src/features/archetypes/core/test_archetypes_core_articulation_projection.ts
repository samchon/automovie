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

/** A reversible follower resolves a drive, and a crank carries a level pedal. */
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
}
