import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypePassage,
  type AutoMovieArchetypeRide,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { steerAutoMovieCrowd } from "@automovie/engine";
import type {
  IAutoMovieCrowdAgent,
  IAutoMovieSteerCrowd,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Metres between the horses of the line. */
const FILE: number = 2.5;

/** Seconds between reads. */
const STEP: number = 0.1;

/** The authored clearance a horse keeps from a person, metres. */
const CLEARANCE: number = 0.2;

/** Half of Fruin's 0.61 m body-ellipse breadth (Fruin 1971): a standing person's disc. */
const PERSON: number = 0.305;

/**
 * A mounted line leg-yields into a standing crowd: the line keeps its alignment, and the people give way round the horses' actual bodies.
 *
 * Scenarios:
 *
 * 1. Three horses leg-yield abreast and stay level and evenly spaced within the alignment bound.
 * 2. Standing people steered round the horses' posed envelopes make no contact with them.
 * 3. Every person's steered course keeps the authored clearance from every horse's posed envelope.
 * 4. People walking up the street part round an overtaking carriage outside the clearance and close back to their lanes behind it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the line, the crowd and the three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Rides real horses with a leg-yield leg, steers real crowd agents round `AutoMovieArchetypePassage.obstacle` of each ride's posed envelope, and measures the steered courses with `AutoMovieArchetypePassage`.
 * @evidence contracts/development/testing.md#independent-expectations The line starts abreast on one course shape, so identical rides stay level and spaced by their starts; the authored clearance and Fruin's breadth bound the people.
 * @evidence contracts/development/testing.md#distinguishing-cases Three horses and four people in their way. The hoof crossing of a leg-yield is pinned by equine's lateral specs and a trapped person's refusal by test_world_mounted_formations.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only feature spec.
 */
export function test_world_mounted_crowd_line(): void {
  const horse: ReturnType<typeof createHorse> = createHorse(
    { withersHeight: 1.65, tempo: 0 },
    "police",
  );
  const rides: AutoMovieArchetypeRide.IRide<string, string>[] = [-1, 0, 1].map(
    (file: number): AutoMovieArchetypeRide.IRide<string, string> =>
      rideHorse(
        horse,
        {
          start: { x: file * FILE, z: 0, heading: 0 },
          cruise: 1.2,
          startSpeed: 0,
          endSpeed: 0,
          acceleration: 1,
          deceleration: 1,
          startFromStanding: true,
          legs: [
            {
              kind: "straight",
              length: 8,
              equineFootwork: {
                kind: "leg-yield",
                toward: "left",
                angle: 25,
                blend: 0.6,
              },
            },
          ],
        },
        "walk",
      ),
  );
  const end: number = rides[0]!.duration;

  // 1. The line keeps its alignment.
  const level: boolean = Array.from(
    { length: Math.floor(end / STEP) + 1 },
    (_: unknown, k: number): number => k * STEP,
  ).every((seconds: number): boolean => {
    const at: IAutoMovieVector3[] = rides.map(
      (ride: AutoMovieArchetypeRide.IRide<string, string>): IAutoMovieVector3 =>
        ride.at(seconds).placement.translation,
    );
    return (
      Math.abs(at[0]!.z - at[2]!.z) <= 0.05 &&
      Math.abs(at[1]!.x - at[0]!.x - FILE) <= 0.05 &&
      Math.abs(at[2]!.x - at[1]!.x - FILE) <= 0.05
    );
  });
  TestValidator.predicate(
    "the leg-yielding line stays level and evenly spaced",
    level,
  );

  // 2. The crowd gives way round the horses' actual bodies.
  const participants: AutoMovieArchetypePassage.IParticipant[] = rides.map(
    (
      ride: AutoMovieArchetypeRide.IRide<string, string>,
      k: number,
    ): AutoMovieArchetypePassage.IParticipant => ({
      id: `horse${k}`,
      plan: ride.plan,
      footprint: AutoMovieArchetypePassage.envelope(ride, 0, end, STEP),
      margin: CLEARANCE,
    }),
  );
  const people: IAutoMovieVector3[] = [-2, -0.5, 1, 2.5].map(
    (x: number): IAutoMovieVector3 => ({ x, y: 0, z: 5 }),
  );
  const steered: IAutoMovieSteerCrowd.IResult = steerAutoMovieCrowd({
    agents: people.map(
      (at: IAutoMovieVector3): IAutoMovieCrowdAgent => ({
        at,
        goal: { x: at.x - 6, y: 0, z: at.z + 1 },
        radius: PERSON,
        speed: 1.2,
        start: 0,
      }),
    ),
    obstacles: participants.map(AutoMovieArchetypePassage.obstacle),
    from: 0,
    to: end,
  });
  TestValidator.equals(
    "no person touches a horse",
    steered.contacts.filter(
      (contact: IAutoMovieCrowdAgent.IContact): boolean =>
        contact.other.kind === "obstacle",
    ).length,
    0,
  );

  // 3. Every person keeps the clearance from every horse's posed body.
  const walkers: AutoMovieArchetypePassage.IParticipant[] = steered.courses.map(
    (
      course: IAutoMovieCrowdAgent.ICourse,
      k: number,
    ): AutoMovieArchetypePassage.IParticipant => ({
      id: `person${k}`,
      plan: AutoMovieArchetypeCourse.timed(
        `person${k}`,
        Array.from(
          { length: Math.floor(end / 0.25) + 1 },
          (_: unknown, i: number): AutoMovieArchetypeCourse.ISample => {
            const at: IAutoMovieVector3 = course.at(i * 0.25).position;
            return { seconds: i * 0.25, x: at.x, y: 0, z: at.z };
          },
        ),
      ),
      footprint: { outline: [{ x: 0, y: 0, z: 0 }], radius: PERSON },
      margin: 0,
    }),
  );
  const close: AutoMovieArchetypePassage.IConflict[] =
    AutoMovieArchetypePassage.conflicts("crowd line", {
      participants: [...participants, ...walkers],
      step: STEP,
      to: end,
    }).filter(
      (found: AutoMovieArchetypePassage.IConflict): boolean =>
        found.subject.startsWith("horse") && found.other.startsWith("person"),
    );
  TestValidator.equals(
    `every person clears every horse: ${JSON.stringify(close.slice(0, 2))}`,
    close,
    [],
  );
  // 4. People walking up the street part round an overtaking carriage and close behind it.
  const carriage: AutoMovieArchetypePassage.IParticipant = {
    id: "carriage",
    plan: AutoMovieArchetypeCourse.plan("carriage", {
      start: { x: 0, z: -14, heading: 0 },
      legs: [{ kind: "straight", length: 60 }],
      cruise: 2.4,
      acceleration: 0.6,
      deceleration: 0.6,
    }),
    footprint: {
      outline: [
        { x: -0.9, y: 0, z: -2.2 },
        { x: 0.9, y: 0, z: -2.2 },
        { x: 0.9, y: 0, z: 2.2 },
        { x: -0.9, y: 0, z: 2.2 },
      ],
      radius: 0,
    },
    margin: CLEARANCE,
  };
  const lanes: readonly number[] = [-0.4, 0.3, 0.5, -0.2];
  const street: IAutoMovieSteerCrowd.IResult = steerAutoMovieCrowd({
    agents: lanes.map(
      (x: number, k: number): IAutoMovieCrowdAgent => ({
        at: { x, y: 0, z: 2 * k },
        goal: { x, y: 0, z: 2 * k + 30 },
        radius: PERSON,
        speed: 1,
        start: 0,
      }),
    ),
    obstacles: [AutoMovieArchetypePassage.obstacle(carriage)],
    from: 0,
    to: 30,
  });
  const gap: number = Math.min(
    ...street.courses.flatMap(
      (course: IAutoMovieCrowdAgent.ICourse): number[] =>
        Array.from({ length: 301 }, (_: unknown, i: number): number => {
          const at: IAutoMovieVector3 = course.at(i * 0.1).position;
          const centre: IAutoMovieVector3 = carriage.plan.at(i * 0.1).placement
            .translation;
          return (
            Math.hypot(
              Math.max(Math.abs(at.x - centre.x) - 0.9, 0),
              Math.max(Math.abs(at.z - centre.z) - 2.2, 0),
            ) - PERSON
          );
        }),
    ),
  );
  const parted: boolean = street.courses.every(
    (course: IAutoMovieCrowdAgent.ICourse, k: number): boolean =>
      Array.from({ length: 301 }, (_: unknown, i: number): number =>
        Math.abs(course.at(i * 0.1).position.x - lanes[k]!),
      ).some((aside: number): boolean => aside > 0.3),
  );
  const closed: boolean = street.courses.every(
    (course: IAutoMovieCrowdAgent.ICourse, k: number): boolean =>
      Math.abs(course.at(30).position.x - lanes[k]!) <= 0.3,
  );
  TestValidator.predicate(
    `people part round the overtaking carriage outside the clearance and close behind it: gap ${gap.toFixed(3)} parted ${parted} closed ${closed}`,
    gap >= CLEARANCE - 1e-6 && parted && closed,
  );
}
