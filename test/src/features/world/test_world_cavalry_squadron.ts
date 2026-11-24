import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeManoeuvre,
  AutoMovieArchetypePassage,
  AutoMovieArchetypeQuadrupedGait,
  type AutoMovieArchetypeRide,
  createHorse,
  createQuadruped,
  rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/** Files in each rank. */
const FILES: number = 3;

/**
 * Metres between files, knee to knee with room for the horses' posed limbs: an
 * authored staging choice.
 */
const SPACING: number = 2.2;

/** Metres between the two ranks' wheel radii. */
const RANKS: number = 4;

/** Seconds between envelope reads and passage instants. */
const STEP: number = 0.2;

/**
 * A two-rank squadron wheels a quarter at the trot on real rides: every horse
 * keeps its posed footprint clear of every other, and the replay repeats.
 *
 * Scenarios:
 *
 * 1. Each file rides its arc of the wheel on its own horse, the rear rank its rank
 *    distance behind on the same arcs, outer files faster in proportion to
 *    their radius.
 * 2. No two horses' posed envelopes come within the mounts' margin at any instant
 *    of the wheel.
 * 3. A second build of the same squadron reads the same poses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the squadron, the wheel and the three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Plans `AutoMovieArchetypeManoeuvre.wheel`, rides each file with `rideQuadruped` and measures `AutoMovieArchetypePassage` on each ride's posed envelope.
 * @evidence contracts/development/testing.md#independent-expectations An even wheel's speed is radius times rate. Posed envelopes bound the displayed horses. A deterministic build repeats.
 * @evidence contracts/development/testing.md#distinguishing-cases Inner and outer files and both ranks. The wheel's speed refusal is pinned by test_world_mounted_manoeuvres and gait changes on cue by test_world_mounted_cues.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only feature spec over real rides.
 */
export function test_world_cavalry_squadron(): void {
  const horse: AutoMovieArchetype = createHorse(
    { withersHeight: 1.62, tempo: 0 },
    1029,
  );
  const trot: AutoMovieArchetypeManoeuvre.ISpeedRange =
    AutoMovieArchetypeQuadrupedGait.range(
      createQuadruped.species(horse),
      "trot",
      1.62,
    );
  const inner: number = 8;
  const rate: number = (trot.minimum * 1.15) / inner;
  const build: () => AutoMovieArchetypeRide.IRide<
    string,
    string
  >[] = (): AutoMovieArchetypeRide.IRide<string, string>[] =>
    [0, 1].flatMap(
      (rank: number): AutoMovieArchetypeRide.IRide<string, string>[] =>
        AutoMovieArchetypeManoeuvre.wheel(
          "squadron",
          {
            centre: { x: 0, y: 0, z: 0 },
            bearing: -90 - (rank * RANKS * 180) / (Math.PI * inner),
            inner,
            spacing: SPACING,
            files: FILES,
            sweep: 90,
            start: 0,
            end: Math.PI / 2 / rate,
          },
          trot,
          STEP,
        ).map(
          (
            samples: AutoMovieArchetypeCourse.ISample[],
          ): AutoMovieArchetypeRide.IRide<string, string> =>
            rideQuadruped(
              horse,
              AutoMovieArchetypeCourse.timed("trooper", samples),
            ),
        ),
    );
  const rides: AutoMovieArchetypeRide.IRide<string, string>[] = build();
  const end: number = Math.max(
    ...rides.map(
      (ride: AutoMovieArchetypeRide.IRide<string, string>): number =>
        ride.duration,
    ),
  );

  // 1. Outer files faster in proportion to radius.
  const middle: number = Math.PI / 4 / rate;
  TestValidator.predicate(
    "each file of the first rank rides its radius times the rate",
    rides
      .slice(0, FILES)
      .every(
        (
          ride: AutoMovieArchetypeRide.IRide<string, string>,
          file: number,
        ): boolean =>
          Math.abs(
            ride.plan.at(middle).speed - (inner + file * SPACING) * rate,
          ) <=
          0.02 * rate * inner,
      ),
  );

  // 2. No two posed envelopes within the margin.
  const conflicts: AutoMovieArchetypePassage.IConflict[] =
    AutoMovieArchetypePassage.conflicts("squadron", {
      participants: rides.map(
        (
          ride: AutoMovieArchetypeRide.IRide<string, string>,
          k: number,
        ): AutoMovieArchetypePassage.IParticipant => ({
          id: `trooper${k}`,
          plan: ride.plan,
          footprint: AutoMovieArchetypePassage.envelope(
            ride,
            0,
            ride.duration,
            STEP,
          ),
          margin: 0.1,
        }),
      ),
      step: STEP,
      to: end,
    });
  TestValidator.equals(
    `no two troopers' bodies meet: ${JSON.stringify(conflicts.slice(0, 2))}`,
    conflicts,
    [],
  );

  // 3. The replay repeats.
  const again: AutoMovieArchetypeRide.IRide<string, string>[] = build();
  TestValidator.equals(
    "a second build reads the same poses",
    again.map((ride: AutoMovieArchetypeRide.IRide<string, string>) =>
      ride.at(middle),
    ),
    rides.map((ride: AutoMovieArchetypeRide.IRide<string, string>) =>
      ride.at(middle),
    ),
  );
}
