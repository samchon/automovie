import {
  ArchetypeCourse,
  ArchetypeManoeuvre,
  ArchetypePassage,
  type ArchetypeRide,
  QuadrupedGait,
  createHorse,
  createQuadruped,
  rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/** Riders on the loop. */
const RIDERS: number = 3;

/** Seconds a lap takes. */
const LAP: number = 20;

/** Seconds between reads. */
const STEP: number = 0.2;

/**
 * Riders circle a Cantabrian loop at the canter on real rides, spaced evenly round it: every ride holds its bends at its gait and no two bodies meet as the loop closes.
 *
 * Scenarios:
 *
 * 1. Each rider's ride samples every second of two laps without a refusal, at the canter the loop's speed calls for.
 * 2. No two riders' posed envelopes meet at any instant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the loop and the two scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the loop with `ArchetypeManoeuvre.arc` against the canter's speeds, rides each rider with `rideQuadruped` and measures `ArchetypePassage` on posed envelopes.
 * @evidence contracts/development/testing.md#independent-expectations The loop's radius puts its even speed inside the canter's declared range; even spacing round the loop keeps a third of its length between riders.
 * @evidence contracts/development/testing.md#distinguishing-cases Every rider and both laps. Loosing windows and the loop-radius refusal are pinned by test_world_mounted_manoeuvres.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only feature spec over real rides.
 */
export function test_world_cantabrian_circle(): void {
  const horse: ReturnType<typeof createHorse> = createHorse(
    { withersHeight: 1.6, tempo: 0 },
    "javelin",
  );
  const canter: ArchetypeManoeuvre.ISpeedRange = QuadrupedGait.range(
    createQuadruped.species(horse),
    "canter",
    1.6,
  );
  const speed: number = (canter.minimum + canter.maximum) / 2;
  const radius: number = (speed * LAP) / (2 * Math.PI);
  const rides: ArchetypeRide.IRide<string, string>[] = Array.from(
    { length: RIDERS },
    (_: unknown, k: number): ArchetypeRide.IRide<string, string> =>
      rideQuadruped(horse, {
        plan: ArchetypeCourse.timed(
          `rider${k}`,
          ArchetypeManoeuvre.arc(
            "loop",
            {
              centre: { x: 0, y: 0, z: 0 },
              radius,
              bearing: (360 * k) / RIDERS,
              sweep: 720,
              start: 0,
              end: 2 * LAP,
            },
            canter,
            0.1,
          ),
        ),
        cues: [{ from: 0, to: 2 * LAP, gait: "canter" }],
      }),
  );

  // 1. Every second of two laps rides without a refusal.
  let refused: string = "none";
  for (const [k, ride] of rides.entries())
    for (
      let seconds: number = 0;
      seconds <= 2 * LAP && refused === "none";
      seconds += STEP
    )
      try {
        ride.at(seconds);
      } catch (error) {
        refused = `rider ${k} at ${seconds.toFixed(1)} s: ${error instanceof Error ? error.message : String(error)}`;
      }
  TestValidator.equals(
    "every rider holds the loop at the canter",
    refused,
    "none",
  );

  // 2. No two bodies meet as the loop closes.
  TestValidator.equals(
    "no two riders' bodies meet",
    ArchetypePassage.conflicts("loop", {
      participants: rides.map(
        (
          ride: ArchetypeRide.IRide<string, string>,
          k: number,
        ): ArchetypePassage.IParticipant => ({
          id: `rider${k}`,
          plan: ride.plan,
          footprint: ArchetypePassage.envelope(ride, 0, 2 * LAP, STEP),
          margin: 0.5,
        }),
      ),
      step: STEP,
    }),
    [],
  );
}
