import {
  AutoMovieArchetypeCourse,
  type AutoMovieArchetypeManoeuvre,
  AutoMovieArchetypeOval,
  AutoMovieArchetypePassage,
  AutoMovieArchetypeQuadrupedGait,
  type AutoMovieArchetypeRide,
  createHorse,
  createQuadruped,
  createRaceRail,
  rideQuadruped,
} from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The authored bump: the rail distances over which the outer runner leans in on
 * the inner one, metres.
 */
const BUMP: readonly number[] = [120, 140];

/** Bodies within a centimetre touch: the contact tolerance of a bump, metres. */
const CONTACT: number = 0.01;

/** Metres of the home straight the race runs before its post. */
const POST: number = 240;

/** Metres after the post over which the field pulls up. */
const PULL: number = 60;

/**
 * Two runners race down the home straight on real gallop rides, bump on an
 * authored stretch, pass the post and pull up.
 *
 * Scenarios:
 *
 * 1. The runners' posed bodies meet only inside the authored bump, never
 *    elsewhere.
 * 2. Each runner's ride samples the whole race and pull-up without a refusal, its
 *    gait changing down after the post.
 * 3. The same plans and seed replay the same race.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the race, the bump, the pull-up and the two scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Rides real horses with `rideQuadruped` on timed lane plans down the oval's home straight, measures posed envelopes with `AutoMovieArchetypePassage`, and reads the rides' gait instants.
 * @evidence contracts/development/testing.md#independent-expectations The bump is authored as two lanes closing to touching between two rail distances, so contact must fall inside the times the runners cover them; a pull-up below the gallop's least speed must leave the gallop.
 * @evidence contracts/development/testing.md#distinguishing-cases Inside and outside the bump, before and after the post. The break, the order by pace and the rail clearance are pinned by test_world_race_field and test_world_mounted_cues; the jockeys' crouch contacts are pinned by test_motion_mount_equestrian_twopoint_race.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only feature spec over real rides.
 */
export function test_world_race_finish(): void {
  const rail: ReturnType<typeof createRaceRail> = createRaceRail({}, 1034);
  const oval: AutoMovieArchetypeOval.IOval = AutoMovieArchetypeOval.lapped(
    createRaceRail.LAP,
    rail.dimensions.radius!,
  );
  const horse: ReturnType<typeof createHorse> = createHorse(
    { withersHeight: 1.62, tempo: 0 },
    1001,
  );
  const gallop: AutoMovieArchetypeManoeuvre.ISpeedRange =
    AutoMovieArchetypeQuadrupedGait.range(
      createQuadruped.species(horse),
      "gallop",
      1.62,
    );
  const pace: number = (gallop.minimum + gallop.maximum) / 2;
  const breadth: number = 0.9;
  const lane: (
    k: number,
    offset: number,
  ) => AutoMovieArchetypeCourse.ISample[] = (
    k: number,
    offset: number,
  ): AutoMovieArchetypeCourse.ISample[] => {
    const racing: AutoMovieArchetypeCourse.ISample[] =
      AutoMovieArchetypeOval.lane(
        `runner${k}`,
        oval,
        [
          { distance: 0, offset, speed: pace },
          ...(k === 1
            ? [
                { distance: BUMP[0]! - 20, offset, speed: pace },
                { distance: BUMP[0]!, offset: 1 + breadth * 0.5, speed: pace },
                { distance: BUMP[1]!, offset: 1 + breadth * 0.5, speed: pace },
                { distance: BUMP[1]! + 20, offset, speed: pace },
              ]
            : []),
          { distance: POST, offset, speed: pace },
        ],
        0,
        0.1,
        gallop,
      );
    const finish: number = racing.at(-1)!.seconds;

    // The pull-up: an even slowing along the straight to a trot's pace over `PULL` metres.
    const slow: number = gallop.minimum * 0.5;
    const time: number = (2 * PULL) / (pace + slow);
    return [
      ...racing,
      ...Array.from(
        { length: 20 },
        (_: unknown, i: number): AutoMovieArchetypeCourse.ISample => {
          const t: number = ((i + 1) * time) / 20;
          const along: number = pace * t - ((pace - slow) * t * t) / (2 * time);
          const at: IAutoMovieVector3 = AutoMovieArchetypeOval.point(
            oval,
            POST + along,
            offset,
          );
          return { seconds: finish + t, x: at.x, y: 0, z: at.z };
        },
      ),
    ];
  };
  const rides: AutoMovieArchetypeRide.IRide<string, string>[] = [
    1,
    1 + breadth + 0.3,
  ].map(
    (offset: number, k: number): AutoMovieArchetypeRide.IRide<string, string> =>
      rideQuadruped(horse, {
        plan: AutoMovieArchetypeCourse.timed(`runner${k}`, lane(k, offset)),
        cues: [{ from: 0, to: POST / pace, gait: "gallop" }],
      }),
  );

  // 1. Bodies meet only inside the bump.
  const met: AutoMovieArchetypePassage.IConflict[] =
    AutoMovieArchetypePassage.conflicts("race", {
      participants: rides.map(
        (
          ride: AutoMovieArchetypeRide.IRide<string, string>,
          k: number,
        ): AutoMovieArchetypePassage.IParticipant => ({
          id: `runner${k}`,
          plan: ride.plan,
          footprint: AutoMovieArchetypePassage.envelope(
            ride,
            0,
            ride.duration,
            0.2,
          ),
          margin: CONTACT,
        }),
      ),
      step: 0.05,
    });
  TestValidator.predicate(
    `the runners meet only inside the authored bump: ${JSON.stringify(met)}`,
    met.length >= 1 &&
      met.every(
        (found: AutoMovieArchetypePassage.IConflict): boolean =>
          found.from >= (BUMP[0]! - 20) / pace &&
          found.to <= (BUMP[1]! + 20) / pace,
      ),
  );

  // 2. Whole race and pull-up ride, and the gait changes down after the post.
  let refused: string = "none";
  for (const [k, ride] of rides.entries())
    for (
      let seconds: number = 0;
      seconds <= ride.duration && refused === "none";
      seconds += 0.2
    )
      try {
        ride.at(seconds);
      } catch (error) {
        refused = `runner ${k} at ${seconds.toFixed(1)} s: ${error instanceof Error ? error.message : String(error)}`;
      }
  TestValidator.equals(
    "every runner rides the race and the pull-up",
    refused,
    "none",
  );
  TestValidator.predicate(
    "each runner's gait changes down after the post",
    rides.every((ride: AutoMovieArchetypeRide.IRide<string, string>): boolean =>
      ride.instants.some(
        (
          i: AutoMovieArchetypeRide.IRide<string, string>["instants"][number],
        ): boolean =>
          i.label.startsWith("gait:gallop-") && i.seconds >= POST / pace,
      ),
    ),
  );
  // 3. The same plans and seed replay the same race.
  const again: AutoMovieArchetypeRide.IRide<string, string> = rideQuadruped(
    horse,
    {
      plan: AutoMovieArchetypeCourse.timed("runner0", lane(0, 1)),
      cues: [{ from: 0, to: POST / pace, gait: "gallop" }],
    },
  );
  TestValidator.equals(
    "a rebuilt runner reads the same poses",
    [5, 15, 30].map((seconds: number) => again.at(seconds)),
    [5, 15, 30].map((seconds: number) => rides[0]!.at(seconds)),
  );
}
