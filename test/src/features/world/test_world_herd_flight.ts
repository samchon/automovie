import { ArchetypePassage, createHorse } from "@automovie/archetypes";
import { steerAutoMovieCrowd } from "@automovie/engine";
import type {
  IAutoMovieCrowdAgent,
  IAutoMovieSteerCrowd,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** The alarm's film second. */
const ALARM: number = 2;

/** The declared reaction from the alarm to the first step, seconds: an authored staging choice. */
const REACTION: number = 0.4;

/** The gate's opening, metres: wider than one horse and narrower than two. */
const OPENING: number = 1.6;

/**
 * A grazing band takes flight on an alarm, bunches and goes through a gate in single file.
 *
 * Scenarios:
 *
 * 1. No horse moves before the alarm and its reaction, and every horse is moving within a stride's time after it.
 * 2. The band's spread contracts as it bunches toward the gate.
 * 3. The band passes the gate one at a time: no two horses are in the opening together.
 * 4. No two horses touch, each a disc as wide as its own footprint.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the band, the alarm, the gate and the four scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Steers real horse-sized agents with the engine's crowd steering from their seeded grazing places to a gate and reads their courses.
 * @evidence contracts/development/testing.md#independent-expectations Each agent starts at the alarm plus the declared reaction. The opening is narrower than two horse breadths, so two in it together would touch. The discs' radius is half the horse footprint's breadth.
 * @evidence contracts/development/testing.md#distinguishing-cases Before and after the alarm, the scattered band and the bunch, the gate and the open field. Each horse's ridden gait over these courses uses the timed ride pinned by test_archetype_ride_course_timed_horse.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only feature spec.
 */
export function test_world_herd_flight(): void {
  const outline: readonly IAutoMovieVector3[] = ArchetypePassage.footprint(
    createHorse({ withersHeight: 1.6 }, "mare"),
  ).outline;
  const radius: number =
    (Math.max(...outline.map((p: IAutoMovieVector3): number => p.x)) -
      Math.min(...outline.map((p: IAutoMovieVector3): number => p.x))) /
    2;
  const grazing: IAutoMovieVector3[] = [
    { x: -6, y: 0, z: -4 },
    { x: -2, y: 0, z: -6 },
    { x: 3, y: 0, z: -5 },
    { x: 6, y: 0, z: -3 },
    { x: 0, y: 0, z: -9 },
  ];
  const gate: IAutoMovieVector3 = { x: 0, y: 0, z: 8 };
  const steered: IAutoMovieSteerCrowd.IResult = steerAutoMovieCrowd({
    agents: grazing.map(
      (at: IAutoMovieVector3): IAutoMovieCrowdAgent => ({
        at,
        goal: [gate, { x: 0, y: 0, z: 20 }],
        radius,
        speed: 3,
        start: ALARM + REACTION,
      }),
    ),
    obstacles: [-1, 1].map(
      (side: number): IAutoMovieCrowdAgent.IObstacle => ({
        footprint: [
          { x: side * (OPENING / 2), y: 0, z: 7.8 },
          { x: side * (OPENING / 2 + 8), y: 0, z: 7.8 },
          { x: side * (OPENING / 2 + 8), y: 0, z: 8.2 },
          { x: side * (OPENING / 2), y: 0, z: 8.2 },
        ],
      }),
    ),
    from: 0,
    to: 20,
  });
  const at: (k: number, seconds: number) => IAutoMovieVector3 = (
    k: number,
    seconds: number,
  ): IAutoMovieVector3 => steered.courses[k]!.at(seconds).position;
  const moved: (k: number, seconds: number) => boolean = (
    k: number,
    seconds: number,
  ): boolean =>
    Math.hypot(
      at(k, seconds).x - grazing[k]!.x,
      at(k, seconds).z - grazing[k]!.z,
    ) > 0.01;

  // 1. Flight on the alarm.
  TestValidator.predicate(
    "no horse moves before the alarm and its reaction, every horse moves soon after",
    grazing.every(
      (_: IAutoMovieVector3, k: number): boolean =>
        !moved(k, ALARM + REACTION - 0.01) && moved(k, ALARM + REACTION + 1),
    ),
  );

  // 2. The band bunches.
  const spread: (seconds: number) => number = (seconds: number): number =>
    Math.max(
      ...grazing.flatMap((_: IAutoMovieVector3, i: number): number[] =>
        grazing.map((__: IAutoMovieVector3, j: number): number =>
          Math.hypot(
            at(i, seconds).x - at(j, seconds).x,
            at(i, seconds).z - at(j, seconds).z,
          ),
        ),
      ),
    );
  TestValidator.predicate(
    `the band's spread contracts toward the gate: ${spread(0).toFixed(2)} to ${spread(ALARM + 3).toFixed(2)}`,
    spread(ALARM + 3) < spread(0),
  );

  // 3. Single file through the opening, and 4. no contact.
  const times: number[] = Array.from(
    { length: 201 },
    (_: unknown, i: number): number => i * 0.1,
  );
  const pairs: boolean = times.every((seconds: number): boolean => {
    const inGate: number = grazing.filter(
      (_: IAutoMovieVector3, k: number): boolean =>
        Math.abs(at(k, seconds).z - gate.z) <= radius &&
        Math.abs(at(k, seconds).x) <= OPENING / 2,
    ).length;
    return inGate <= 1;
  });
  TestValidator.predicate("the band passes the gate one at a time", pairs);
  TestValidator.equals("no two horses touch", steered.contacts.length, 0);
}
