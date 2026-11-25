import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  type AutoMovieArchetypeManoeuvre,
  AutoMovieArchetypeOval,
  AutoMovieArchetypePassage,
  AutoMovieArchetypeQuadrupedGait,
  AutoMovieArchetypeRefusal,
  createHorse,
  createQuadruped,
  createRaceRail,
  createStartingGate,
} from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../../../internal/predicates";

/** Runners in the field, one per stall. */
const RUNNERS: number = 4;

/** The race's rail distance, metres: the home straight and into the first turn. */
const RACE: number = 400;

/** Authored clearances: between runners, and from the rail, metres. */
const CLEARANCE: number = 0.05;

/**
 * Break a field from a starting gate on its race plans round an oval rail.
 *
 * Scenarios:
 *
 * 1. The rail laps one mile, starts at the home straight and reaches the first
 *    turn's apex where the oval's geometry puts it.
 * 2. Each runner leaves the middle of its stall and keeps the rail distance its
 *    pace gives, so the faster runners lead in order.
 * 3. The field keeps the authored clearance from the rail and from each other on
 *    concentric lanes.
 * 4. A faster runner planned onto a slower one's lane refuses with both names and
 *    the interval, and a pace beyond the gallop refuses on its mark.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the layout, the break, the clearances and the refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the rail and the gate, plans each runner with `AutoMovieArchetypeOval.lane` and measures with `AutoMovieArchetypePassage`.
 * @evidence contracts/development/testing.md#independent-expectations A one-mile lap; the apex lies a straight's half plus a radius ahead of the centre; at an even pace the rail distance is pace times time; the stall middles are one Derby pitch apart; two runners on one lane at different paces must meet.
 * @evidence contracts/development/testing.md#distinguishing-cases Admitted concentric lanes, a refused shared lane, a refused pace and the rail's start and apex. The first hoof event after the doors open needs the timed ride (#3905).
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only feature spec over models and plans.
 */
export function test_archetypes_race_field(): void {
  // 1. The rail.
  const rail: AutoMovieArchetype = createRaceRail({}, 1034);
  const oval: AutoMovieArchetypeOval.IOval = AutoMovieArchetypeOval.lapped(
    createRaceRail.LAP,
    rail.dimensions.radius!,
  );
  TestValidator.predicate(
    "the rail laps one mile from the home straight's start to the first turn's apex",
    nclose(AutoMovieArchetypeOval.length(oval), 1609.344, 1e-9) &&
      vclose(
        rail.affordance("start").frame.translation,
        AutoMovieArchetypeOval.point(oval, 0, 0),
        1e-9,
      ) &&
      vclose(
        AutoMovieArchetypeOval.point(
          oval,
          oval.straight + (Math.PI * oval.radius) / 2,
          0,
        ),
        { x: 0, y: 0, z: oval.straight / 2 + oval.radius },
        1e-9,
      ),
  );

  // 2. The break from the gate and the order by pace.
  const horse: AutoMovieArchetype = createHorse({ withersHeight: 1.62 }, 1001);
  const gallop: AutoMovieArchetypeManoeuvre.ISpeedRange =
    AutoMovieArchetypeQuadrupedGait.range(
      createQuadruped.species(horse),
      "gallop",
      1.62,
    );
  const gate: AutoMovieArchetype = createStartingGate(
    { stalls: RUNNERS },
    1012,
  );
  const pitch: number = createStartingGate.PITCH;
  // The gate stands across the home straight's start, its stall nearest the rail one metre out.
  const front: number = -(oval.radius + 1) - (RUNNERS / 2 - 0.5) * pitch;
  const stall: (k: number) => number = (k: number): number =>
    front + gate.affordance(`stall${k}`).frame.translation.x;
  const pace: (k: number) => number = (k: number): number =>
    gallop.minimum +
    ((k + 1) / (RUNNERS + 1)) * (gallop.maximum * 0.8 - gallop.minimum);
  const offset: (k: number) => number = (k: number): number =>
    1 + (RUNNERS - 1 - k) * pitch;
  const plans: AutoMovieArchetypeCourse.IPlan[] = Array.from(
    { length: RUNNERS },
    (_: unknown, k: number): AutoMovieArchetypeCourse.IPlan =>
      AutoMovieArchetypeCourse.timed(
        `runner${k}`,
        AutoMovieArchetypeOval.lane(
          `runner${k}`,
          oval,
          [
            { distance: 0, offset: offset(k), speed: pace(k) },
            { distance: RACE, offset: offset(k), speed: pace(k) },
          ],
          0,
          0.1,
          gallop,
        ),
      ),
  );
  TestValidator.predicate(
    "each runner leaves the middle of its stall",
    plans.every(
      (plan: AutoMovieArchetypeCourse.IPlan, k: number): boolean =>
        nclose(plan.at(0).placement.translation.x, stall(k), 1e-9) &&
        nclose(plan.at(0).placement.translation.z, -oval.straight / 2, 1e-9),
    ),
  );
  TestValidator.predicate(
    "each runner keeps the rail distance its pace gives, so the faster lead",
    plans.every((plan: AutoMovieArchetypeCourse.IPlan, k: number): boolean =>
      [5, 10].every((seconds: number): boolean =>
        vclose(
          plan.at(seconds).placement.translation,
          AutoMovieArchetypeOval.point(oval, pace(k) * seconds, offset(k)),
          1e-6,
        ),
      ),
    ),
  );

  // 3. Clearances from the rail and each other.
  const footprint: AutoMovieArchetypePassage.IFootprint =
    AutoMovieArchetypePassage.footprint(horse);
  const posts: IAutoMovieVector3[] = AutoMovieArchetypeOval.rail(
    oval,
    rail.dimensions.spacing!,
  );
  const near: AutoMovieArchetypePassage.IObstacle[] = posts
    .slice(0, Math.ceil((RACE + 20) / rail.dimensions.spacing!))
    .map(
      (
        at: IAutoMovieVector3,
        k: number,
      ): AutoMovieArchetypePassage.IObstacle => ({
        id: `rail${k}`,
        footprint: {
          outline: [at, posts[k + 1]!],
          radius: rail.dimensions.post!,
        },
        margin: CLEARANCE,
      }),
    );
  const field: (
    lanes: readonly AutoMovieArchetypeCourse.IPlan[],
  ) => AutoMovieArchetypePassage.IProps = (
    lanes: readonly AutoMovieArchetypeCourse.IPlan[],
  ): AutoMovieArchetypePassage.IProps => ({
    participants: lanes.map(
      (
        plan: AutoMovieArchetypeCourse.IPlan,
        k: number,
      ): AutoMovieArchetypePassage.IParticipant => ({
        id: `runner${k}`,
        plan,
        footprint,
        margin: CLEARANCE,
      }),
    ),
    obstacles: near,
    step: 0.1,
  });
  TestValidator.equals(
    "the field clears the rail and each other",
    AutoMovieArchetypePassage.conflicts("race", field(plans)),
    [],
  );

  // 4. Refusals.
  const boxed: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.timed(
    "runner1",
    AutoMovieArchetypeOval.lane(
      "runner1",
      oval,
      [
        { distance: -6, offset: offset(0), speed: pace(3) },
        { distance: RACE, offset: offset(0), speed: pace(3) },
      ],
      0,
      0.1,
      gallop,
    ),
  );
  const shared: AutoMovieArchetypePassage.IConflict[] =
    AutoMovieArchetypePassage.conflicts("race", field([plans[0]!, boxed]));
  TestValidator.predicate(
    `a faster runner on a slower one's lane names both and the interval: ${JSON.stringify(shared)}`,
    shared.length >= 1 &&
      shared.every(
        (found: AutoMovieArchetypePassage.IConflict): boolean =>
          found.subject === "runner0" && found.other === "runner1",
      ) &&
      shared[0]!.from > 0 &&
      shared[0]!.to > shared[0]!.from &&
      shared[0]!.to < RACE / pace(3),
  );
  let refusal: unknown;
  try {
    AutoMovieArchetypeOval.lane(
      "runner",
      oval,
      [
        { distance: 0, offset: 1, speed: gallop.maximum * 1.1 },
        { distance: RACE, offset: 1, speed: gallop.maximum * 1.1 },
      ],
      0,
      0.1,
      gallop,
    );
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "a pace beyond the gallop refuses on its mark",
    refusal instanceof AutoMovieArchetypeRefusal && refusal.axis === "marks[0]",
  );
}
