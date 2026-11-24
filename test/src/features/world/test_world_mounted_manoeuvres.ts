import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeManoeuvre,
  AutoMovieArchetypePassage,
  AutoMovieArchetypeQuadrupedGait,
  AutoMovieArchetypeRefusal,
  createHorse,
  createQuadruped,
} from "@automovie/archetypes";
import { steerAutoMovieCrowd } from "@automovie/engine";
import type {
  IAutoMovieCrowdAgent,
  IAutoMovieQuaternion,
  IAutoMovieSteerCrowd,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/** Seconds between path samples. */
const STEP: number = 0.1;

/**
 * Plan the shared mounted manoeuvres and admit them against a horse's gait speeds and footprint.
 *
 * Scenarios:
 *
 * 1. A four-file wheel at the trot rides each file at its radius times the common rate, and a wheel too fast for the outer file refuses with the inner radii the trot allows.
 * 2. A Cantabrian loop at the canter opens one loosing window per lap, centred on the loop's point nearest the target, and a loop too small refuses with the least radius.
 * 3. A feigned retreat turns about after its cue within its turn's time, and turns back.
 * 4. Escorts keep their stations on a carriage through a turn and clear it by their margin.
 * 5. A horse is a moving obstacle the crowd steers round without contact.
 * 6. A string member treads its leader's line a fixed gap behind, and an opening narrower than a horse and its margin refuses with the post and interval.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists each manoeuvre and its expectation.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieArchetypeManoeuvre`, `AutoMovieArchetypePassage` and the engine's crowd steering with a real horse's gait speeds and footprint, and reads the plans `AutoMovieArchetypeCourse.timed` makes.
 * @evidence contracts/development/testing.md#independent-expectations An even wheel gives speed r times sweep over time, so the outer to inner ratio is their radius ratio and the feasible inner radius is the range over the rate less the line's width. A loop's least radius is the canter's least speed times the lap over two pi. By symmetry a target due north is faced at the loop's north point. A straight leader puts a follower exactly the gap behind. A station is the carrier's placement applied to the offset.
 * @evidence contracts/development/testing.md#distinguishing-cases Admitted and refused wheel and loop, before and after each turn of the retreat, sample and midway station readings, a wide and a narrow opening.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only feature spec; the horses' animated gaits are the timed ride's (#3905).
 */
export function test_world_mounted_manoeuvres(): void {
  const horse: AutoMovieArchetype = createHorse(
    { withersHeight: 1.7 },
    "squadron",
  );
  const range: (
    gait: AutoMovieArchetypeQuadrupedGait.Gait,
  ) => AutoMovieArchetypeManoeuvre.ISpeedRange = (
    gait: AutoMovieArchetypeQuadrupedGait.Gait,
  ): AutoMovieArchetypeManoeuvre.ISpeedRange =>
    AutoMovieArchetypeQuadrupedGait.range(
      createQuadruped.species(horse),
      gait,
      1.7,
    );
  const footprint: AutoMovieArchetypePassage.IFootprint =
    AutoMovieArchetypePassage.footprint(horse);

  // 1. The wheel.
  const trot: AutoMovieArchetypeManoeuvre.ISpeedRange = range("trot");
  const rate: number = (trot.minimum * 1.2) / 6;
  const wheel: AutoMovieArchetypeManoeuvre.IWheel = {
    centre: point(0, 0),
    bearing: -90,
    inner: 6,
    spacing: 1.2,
    files: 4,
    sweep: 90,
    start: 0,
    end: Math.PI / 2 / rate,
  };
  const files: AutoMovieArchetypeCourse.IPlan[] =
    AutoMovieArchetypeManoeuvre.wheel("wheel", wheel, trot, STEP).map(
      (
        samples: AutoMovieArchetypeCourse.ISample[],
      ): AutoMovieArchetypeCourse.IPlan =>
        AutoMovieArchetypeCourse.timed("file", samples),
    );
  const middle: number = wheel.end / 2;
  TestValidator.predicate(
    "each file rides its radius times the common rate",
    files.every((plan: AutoMovieArchetypeCourse.IPlan, file: number): boolean =>
      nclose(plan.at(middle).speed, (6 + 1.2 * file) * rate, 1e-2 * rate),
    ),
  );
  const fast: number = (trot.maximum / (6 + 3.6)) * 1.1;
  let refusal: unknown = caught((): unknown =>
    AutoMovieArchetypeManoeuvre.wheel(
      "wheel",
      { ...wheel, end: Math.PI / 2 / fast },
      trot,
      STEP,
    ),
  );
  TestValidator.predicate(
    "a wheel too fast for the outer file names the inner radii the trot allows",
    refusal instanceof AutoMovieArchetypeRefusal &&
      refusal.axis === "inner" &&
      refusal.feasible?.kind === "range" &&
      nclose(refusal.feasible.minimum!, trot.minimum / fast, 1e-9) &&
      nclose(refusal.feasible.maximum!, trot.maximum / fast - 3.6, 1e-9),
  );

  // 2. The Cantabrian loop and its windows.
  const canter: AutoMovieArchetypeManoeuvre.ISpeedRange = range("canter");
  const lap: number = 12;
  const radius: number = (canter.minimum * 1.3 * lap) / (2 * Math.PI);
  const loop: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.timed(
    "loop",
    AutoMovieArchetypeManoeuvre.arc(
      "loop",
      {
        centre: point(0, 0),
        radius,
        bearing: 180,
        sweep: 720,
        start: 0,
        end: 2 * lap,
      },
      canter,
      STEP,
    ),
  );
  const windows: AutoMovieArchetypeManoeuvre.IWindow[] =
    AutoMovieArchetypeManoeuvre.facing(
      loop,
      point(0, radius + 30),
      -90,
      20,
      0,
      2 * lap,
      STEP,
    );
  TestValidator.predicate(
    `one window a lap at the loop's north point: ${JSON.stringify(windows)}`,
    windows.length === 2 &&
      windows.every((window: AutoMovieArchetypeManoeuvre.IWindow): boolean => {
        const at: IAutoMovieVector3 = loop.at((window.from + window.to) / 2)
          .placement.translation;
        return Math.abs(at.x) < 0.05 * radius && at.z > 0;
      }),
  );
  refusal = caught((): unknown =>
    AutoMovieArchetypeManoeuvre.arc(
      "loop",
      {
        centre: point(0, 0),
        radius: radius / 2,
        bearing: 0,
        sweep: 360,
        start: 0,
        end: lap,
      },
      canter,
      STEP,
    ),
  );
  TestValidator.predicate(
    "a loop too small for the canter names its least radius",
    refusal instanceof AutoMovieArchetypeRefusal &&
      refusal.axis === "radius" &&
      refusal.feasible?.kind === "range" &&
      nclose(
        refusal.feasible.minimum!,
        (canter.minimum * lap) / (2 * Math.PI),
        1e-9,
      ),
  );

  // 3. The feigned retreat: advance, turn about after the cue, flee, turn back.
  const gallop: AutoMovieArchetypeManoeuvre.ISpeedRange = range("gallop");
  const speed: number = gallop.minimum * 1.2;
  const turn: number = 5;
  const about: number = (Math.PI * turn) / speed;
  const cue: number = 4;
  const latency: number = 0.3;
  const begin: number = cue + latency;
  const retreat: AutoMovieArchetypeCourse.IPlan =
    AutoMovieArchetypeCourse.timed("retreat", [
      ...[0, 1, 2, 3, 4].map(
        (k: number): AutoMovieArchetypeCourse.ISample =>
          sample((begin * k) / 4, 0, speed * ((begin * k) / 4)),
      ),
      ...AutoMovieArchetypeManoeuvre.arc(
        "retreat",
        {
          centre: point(turn, speed * begin),
          radius: turn,
          bearing: -90,
          sweep: 180,
          start: begin,
          end: begin + about,
        },
        gallop,
        STEP,
      ).slice(1),
      ...[1, 2, 3].map(
        (k: number): AutoMovieArchetypeCourse.ISample =>
          sample(begin + about + k, 2 * turn, speed * begin - speed * k),
      ),
    ]);
  TestValidator.predicate(
    "the retreat faces the enemy before its cue and flees once its turn is done",
    nclose(heading(retreat, cue), 0, 1) &&
      nclose(Math.abs(heading(retreat, begin + about + 0.5)), 180, 2),
  );

  // 4. Escorts on a carriage.
  const carriage: AutoMovieArchetypeCourse.IPlan =
    AutoMovieArchetypeCourse.plan("carriage", {
      start: { x: 0, z: 0, heading: 0 },
      legs: [
        { kind: "straight", length: 20 },
        { kind: "turn", radius: 15, angle: 90 },
        { kind: "straight", length: 20 },
      ],
      cruise: 2,
      acceleration: 0.5,
      deceleration: 0.5,
    });
  const stations: readonly IAutoMovieVector3[] = [
    point(2.2, 0.8),
    point(-2.2, 0.8),
  ];
  const escorts: AutoMovieArchetypeCourse.IPlan[] = stations.map(
    (offset: IAutoMovieVector3): AutoMovieArchetypeCourse.IPlan =>
      AutoMovieArchetypeCourse.timed(
        "escort",
        AutoMovieArchetypeManoeuvre.station(
          carriage,
          offset,
          0,
          carriage.duration,
          0.25,
        ),
      ),
  );
  TestValidator.predicate(
    "each escort keeps its station through the turn",
    escorts.every((plan: AutoMovieArchetypeCourse.IPlan, k: number): boolean =>
      [10, 10.125, 20, 20.125, 30].every((seconds: number): boolean =>
        vclose(
          local(carriage, plan.at(seconds).placement.translation, seconds),
          stations[k]!,
          0.02,
        ),
      ),
    ),
  );
  TestValidator.equals(
    "the escorts clear the carriage by their margin",
    AutoMovieArchetypePassage.conflicts("escort", {
      participants: [
        { id: "carriage", plan: carriage, footprint: box(0.8, 2), margin: 0.3 },
        ...escorts.map(
          (
            plan: AutoMovieArchetypeCourse.IPlan,
            k: number,
          ): AutoMovieArchetypePassage.IParticipant => ({
            id: `escort${k}`,
            plan,
            footprint: {
              outline: [point(0, -1.2), point(0, 1.2)],
              radius: 0.35,
            },
            margin: 0.3,
          }),
        ),
      ],
      step: 0.1,
    }),
    [],
  );

  // 5. A horse as a moving obstacle in crowd steering.
  const crossing: AutoMovieArchetypeCourse.IPlan =
    AutoMovieArchetypeCourse.timed("crossing", [
      sample(0, 0, -10),
      sample(12.5, 0, 10),
    ]);
  const steered: IAutoMovieSteerCrowd.IResult = steerAutoMovieCrowd({
    agents: [-1, 0, 1].map(
      (lane: number): IAutoMovieCrowdAgent => ({
        at: point(-6, lane),
        goal: point(6, lane),
        radius: 0.3,
        speed: 1.3,
        start: 2,
      }),
    ),
    obstacles: [
      AutoMovieArchetypePassage.obstacle({
        id: "horse",
        plan: crossing,
        footprint,
        margin: 0,
      }),
    ],
    from: 0,
    to: 14,
  });
  TestValidator.equals(
    "the crowd walks round the horse",
    steered.contacts.filter(
      (contact: IAutoMovieCrowdAgent.IContact): boolean =>
        contact.other.kind === "obstacle",
    ).length,
    0,
  );

  // 6. A string member, and openings.
  const leader: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.timed(
    "leader",
    [sample(0, 0, 0), sample(10, 0, 15)],
  );
  const follower: AutoMovieArchetypeCourse.IPlan =
    AutoMovieArchetypeCourse.timed(
      "follower",
      AutoMovieArchetypeManoeuvre.follow(leader, 3.5, 0, 10, 0.25),
    );
  TestValidator.predicate(
    "the follower treads the leader's line its gap behind",
    [5, 7.5, 10].every((seconds: number): boolean =>
      vclose(
        follower.at(seconds).placement.translation,
        point(0, leader.at(seconds).placement.translation.z - 3.5),
        1e-6,
      ),
    ),
  );
  const opening: (half: number) => AutoMovieArchetypePassage.IConflict[] = (
    half: number,
  ): AutoMovieArchetypePassage.IConflict[] =>
    AutoMovieArchetypePassage.conflicts("opening", {
      participants: [{ id: "leader", plan: leader, footprint, margin: 0.5 }],
      obstacles: [-1, 1].map(
        (side: number): AutoMovieArchetypePassage.IObstacle => ({
          id: side < 0 ? "rightPost" : "leftPost",
          footprint: { outline: [point(side * half, 7.5)], radius: 0.1 },
          margin: 0.5,
        }),
      ),
      step: 0.1,
    });
  const narrow: AutoMovieArchetypePassage.IConflict[] = opening(0.7);
  TestValidator.predicate(
    `a narrow opening refuses at both posts while the horse passes them: ${JSON.stringify(narrow)}`,
    opening(2.5).length === 0 &&
      narrow
        .map(
          (found: AutoMovieArchetypePassage.IConflict): string => found.other,
        )
        .sort((a: string, b: string): number => a.localeCompare(b))
        .join() === "leftPost,rightPost" &&
      narrow.every(
        (found: AutoMovieArchetypePassage.IConflict): boolean =>
          found.from < 5 && found.to > 5 && found.to - found.from < 4 / 1.5 + 1,
      ),
  );
}

/** The error a call throws, or undefined. */
function caught(call: () => unknown): unknown {
  try {
    call();
  } catch (error) {
    return error;
  }
  return undefined;
}

/** A plan's heading at a second, degrees. */
function heading(
  plan: AutoMovieArchetypeCourse.IPlan,
  seconds: number,
): number {
  const state: AutoMovieArchetypeCourse.IState = plan.at(seconds);
  const ahead: IAutoMovieVector3 = rotate(state.placement.rotation);
  return (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI;
}

/** A world point in a carrier's frame at a second. */
function local(
  plan: AutoMovieArchetypeCourse.IPlan,
  at: IAutoMovieVector3,
  seconds: number,
): IAutoMovieVector3 {
  const state: AutoMovieArchetypeCourse.IState = plan.at(seconds);
  const ahead: IAutoMovieVector3 = rotate(state.placement.rotation);
  const dx: number = at.x - state.placement.translation.x;
  const dz: number = at.z - state.placement.translation.z;
  return point(dx * ahead.z - dz * ahead.x, dx * ahead.x + dz * ahead.z);
}

/** The world forward of a rotation, the model's `+Z` turned by it. */
function rotate(q: IAutoMovieQuaternion): IAutoMovieVector3 {
  return {
    x: 2 * (q.x * q.z + q.w * q.y),
    y: 2 * (q.y * q.z - q.w * q.x),
    z: 1 - 2 * (q.x * q.x + q.y * q.y),
  };
}

/** A rectangle footprint of half width and half length. */
function box(
  halfWidth: number,
  halfLength: number,
): AutoMovieArchetypePassage.IFootprint {
  return {
    outline: [
      point(-halfWidth, -halfLength),
      point(halfWidth, -halfLength),
      point(halfWidth, halfLength),
      point(-halfWidth, halfLength),
    ],
    radius: 0,
  };
}

/** A course sample on the floor. */
function sample(
  seconds: number,
  x: number,
  z: number,
): AutoMovieArchetypeCourse.ISample {
  return { seconds, x, y: 0, z };
}

/** A floor point. */
function point(x: number, z: number): IAutoMovieVector3 {
  return { x, y: 0, z };
}
