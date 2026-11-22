import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeManoeuvre,
  AutoMovieArchetypePassage,
  type AutoMovieArchetypeRide,
  createHorse,
  rideQuadruped,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/** Animals in the string. */
const ANIMALS: number = 3;

/** Metres between one animal's root and the next along the leader's line: an authored staging choice. */
const GAP: number = 3.7;

/** The lead rope's length from tie to halter, metres: an authored packer's choice. */
const ROPE: number = 2.4;

/** Seconds between reads. */
const STEP: number = 0.1;

/**
 * A pack string follows its leader through a turn on real rides: every lead stays tied within its rope's length between the actual tie on the animal in front and the halter's lead behind, and no two animals' bodies meet.
 *
 * Scenarios:
 *
 * 1. Each animal treads the leader's line its gap behind the one in front.
 * 2. Every lead stays within the rope's length between the tie and the following animal's lead contact at every read.
 * 3. No two animals' posed envelopes meet.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the string and the three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Plans each follower with `AutoMovieArchetypeManoeuvre.follow`, rides each with `rideQuadruped` under a pack saddle, and reads the actual `tie` and `lead` frames and posed envelopes.
 * @evidence contracts/development/testing.md#independent-expectations The rope's length bounds the distance between the two contacts it joins; the gap and the horses' size are authored.
 * @evidence contracts/development/testing.md#distinguishing-cases A straight start and a turn, the first and the last tie. Narrow openings are pinned by test_world_mounted_manoeuvres.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only feature spec over real rides.
 */
export function test_world_pack_string(): void {
  const horse: ReturnType<typeof createHorse> = createHorse(
    { withersHeight: 1.6, tempo: 0, tack: "pack" },
    "packer",
  );
  const leader: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.timed(
    "leader",
    [
      { seconds: 0, x: 0, y: 0, z: 0 },
      { seconds: 4, x: 0, y: 0, z: 6 },
      { seconds: 8, x: 2.5, y: 0, z: 11 },
      { seconds: 12, x: 6.5, y: 0, z: 14 },
      { seconds: 16, x: 11.5, y: 0, z: 15 },
    ],
  );
  const plans: AutoMovieArchetypeCourse.IPlan[] = Array.from(
    { length: ANIMALS },
    (_: unknown, k: number): AutoMovieArchetypeCourse.IPlan =>
      k === 0
        ? leader
        : AutoMovieArchetypeCourse.timed(
            `packer${k}`,
            AutoMovieArchetypeManoeuvre.follow(
              leader,
              k * GAP,
              (k * GAP) / 1.5,
              16,
              0.25,
            ),
          ),
  );
  const rides: AutoMovieArchetypeRide.IRide<string, string>[] = plans.map(
    (
      plan: AutoMovieArchetypeCourse.IPlan,
    ): AutoMovieArchetypeRide.IRide<string, string> =>
      rideQuadruped(horse, plan),
  );
  const reads: number[] = Array.from(
    { length: Math.floor(16 / STEP) + 1 },
    (_: unknown, k: number): number => k * STEP,
  ).filter(
    (seconds: number): boolean => seconds >= ((ANIMALS - 1) * GAP) / 1.5,
  );

  // 1. Each animal treads the leader's line its gap behind.
  TestValidator.predicate(
    "each animal treads the leader's line its gap behind",
    reads.every((seconds: number): boolean =>
      plans
        .slice(1)
        .every(
          (plan: AutoMovieArchetypeCourse.IPlan, k: number): boolean =>
            Vector3.distance(
              plan.at(seconds).placement.translation,
              leader.at(
                leader.when(leader.at(seconds).distance - (k + 1) * GAP),
              ).placement.translation,
            ) <= 0.05,
        ),
    ),
  );

  // 2. Every lead within its rope between the tie in front and the halter behind.
  const stretched: number = Math.max(
    ...reads.flatMap((seconds: number): number[] =>
      rides
        .slice(1)
        .map(
          (
            ride: AutoMovieArchetypeRide.IRide<string, string>,
            k: number,
          ): number =>
            Vector3.distance(
              rides[k]!.frame("tie", seconds).translation,
              ride.frame("lead", seconds).translation,
            ),
        ),
    ),
  );
  TestValidator.predicate(
    `every lead stays within its rope: ${stretched.toFixed(3)} m`,
    stretched <= ROPE,
  );

  // 3. No two bodies meet.
  TestValidator.equals(
    "no two animals' bodies meet",
    AutoMovieArchetypePassage.conflicts("string", {
      participants: rides.map(
        (
          ride: AutoMovieArchetypeRide.IRide<string, string>,
          k: number,
        ): AutoMovieArchetypePassage.IParticipant => ({
          id: `packer${k}`,
          plan: ride.plan,
          footprint: AutoMovieArchetypePassage.envelope(ride, 0, 16, 0.25),
          margin: 0,
        }),
      ),
      step: STEP,
      from: ((ANIMALS - 1) * GAP) / 1.5,
      to: 16,
    }),
    [],
  );
}
