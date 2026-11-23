import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeEquine,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { AutoMovieGravity } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A speed wavering about a change point changes the gait at most once each way.
 *
 * Scenarios, for a horse at two seeds whose course speeds up 0.3 m/s past its walk-to-trot change point and then wavers 0.1 m/s either side of it for eight legs before coming to rest:
 * 1. The ride changes from walk to trot once on the way up and from trot to walk once on the way down: two changes in all.
 * 2. The same with the trot-to-canter change point: walk to trot and trot to canter once each on the way up, and down again once each.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Rides produced horses on a wavering speed and counts the named changes; a gait that flips with every waver is caught.
 * @evidence contracts/development/testing.md#independent-expectations The walk-to-trot change point, a Froude number of 0.35 at the hip joint's height (Griffin et al. 2004), is worked here from the horse's rest rig, and the trot-to-canter one, Heglund and Taylor's trot-gallop speed (5 m/s at 170 kg, rising with mass to the power 0.216), from the horse's mass; the 0.1 m/s waver is the issue's.
 * @evidence contracts/development/testing.md#distinguishing-cases Two seeds and two change points.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_ride_horse_hysteresis(): void {
  const findings: string[] = [];
  for (const seed of [0, 6]) {
    const horse: ReturnType<typeof createHorse> = createHorse({}, seed);
    for (const [low, high, expected] of [
      ["walk", "trot", 2],
      ["trot", "canter", 4],
    ] as const) {
      const point: number =
        low === "walk"
          ? Math.sqrt(
              0.35 *
                AutoMovieGravity.STANDARD *
                AutoMovieArchetypeEquine.rig(horse.dimensions).limbs
                  .leftHind[0]!.y,
            )
          : 5 * (horse.dimensions.mass! / 170) ** 0.216;
      const speeds: number[] = [point + 0.3];
      for (let k: number = 0; k < 8; k++)
        speeds.push(point + (k % 2 === 0 ? -0.1 : 0.1));
      speeds.push(0);
      const course: AutoMovieArchetypeCourse.ICourse = {
        start: { x: 0, z: 0, heading: 0 },
        legs: speeds.map(
          (_: number, k: number): AutoMovieArchetypeCourse.Leg => ({
            kind: "straight",
            length: k === 0 ? 50 : 25,
          }),
        ),
        speeds,
        cruise: point + 0.3,
        acceleration: 1,
        deceleration: 1,
      };
      const changes: string[] = rideHorse(horse, course)
        .instants.filter((i: { label: string }): boolean =>
          i.label.startsWith("gait:"),
        )
        .map((i: { label: string }): string => i.label);
      if (changes.length !== expected)
        findings.push(
          `seed ${seed}, about the ${low}-${high} point: ${changes.join(", ")}`,
        );
    }
  }
  TestValidator.equals(
    "a wavering speed changes the gait once each way",
    findings,
    [],
  );
}
