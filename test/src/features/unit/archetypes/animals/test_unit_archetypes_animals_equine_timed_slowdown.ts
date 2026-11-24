import {
  AutoMovieArchetypeCourse,
  createHorse,
  rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/** One timed sample: film second and the root's world X and Z, metres. */
interface IMark {
  /** Film second. */
  seconds: number;
  /** World X, metres. */
  x: number;
  /** World Z, metres. */
  z: number;
}

/**
 * A horse slowing sharply on a timed path keeps each stride's gait to its next
 * footfall and then takes the gait its speed calls for.
 *
 * Scenarios:
 *
 * 1. A 1.6 m mare trots at 3 m/s, then slows to 1.3 m/s within 0.4 s, under one
 *    trot stride, and walks on: every 20 ms samples, and a `gait:trot-walk`
 *    change follows.
 */
export function test_unit_archetypes_animals_equine_timed_slowdown(): void {
  const horse = createHorse({ withersHeight: 1.6, tempo: 0 }, 1003);
  const issues: string[] = [];
  const marks = (slow: number): IMark[] => {
    const out: IMark[] = [];
    let z: number = 0;
    for (let k: number = 0; k <= 60; k++) {
      const seconds: number = k * 0.1;
      const speed: number =
        seconds < 2
          ? 3
          : seconds >= 2.4
            ? slow
            : 3 + ((slow - 3) * (seconds - 2)) / 0.4;
      out.push({ seconds, x: 0, z });
      z += speed * 0.1;
    }
    return out;
  };
  const ride = rideQuadruped(
    horse,
    AutoMovieArchetypeCourse.timed("mare", marks(1.3)),
  );
  for (let at: number = 0; at <= ride.duration; at += 0.02)
    try {
      ride.at(at);
    } catch (error) {
      issues.push(
        `slowdown at ${at.toFixed(2)} s: ${error instanceof Error ? error.message : String(error)}`,
      );
      break;
    }
  if (
    !ride.instants.some(
      (event): boolean => event.label === "gait:trot-walk" && event.seconds > 2,
    )
  )
    issues.push("no trot-walk change follows the slowdown");
  TestValidator.equals("sharp timed slowdown", issues, []);
}
