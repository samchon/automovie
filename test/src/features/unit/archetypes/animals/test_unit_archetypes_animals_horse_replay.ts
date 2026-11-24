import { createHorse, rideHorse } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * Seeded horse construction and ride queries are independent of call order.
 *
 * Scenarios:
 * 1. Rebuilding each of the four tacks at seeds 1 to 3 after constructing
 *    another horse produces the same serialized model, contacts and mass.
 * 2. Two independently constructed trotting rides return the same serialized
 *    poses at 0.5, 1, 2 and 4 seconds when queried in opposite orders.
 * 3. Querying the earlier ride again after its later poses preserves those
 *    same poses, catching an order-dependent playback cursor.
 */
export function test_unit_archetypes_animals_horse_replay(): void {
  for (const tack of ["saddle", "harness", "pack", "both"] as const)
    for (const seed of [1, 2, 3]) {
      const first: string = JSON.stringify(createHorse({ tack }, seed));
      createHorse({ tack: "pack" }, seed + 1);
      const second: string = JSON.stringify(createHorse({ tack }, seed));
      TestValidator.equals(tack + " seed " + seed + " replays", second, first);
    }

  /** Build independent model and playback state for each query order. */
  const makeRide: () => ReturnType<typeof rideHorse> = (): ReturnType<
    typeof rideHorse
  > =>
    rideHorse(
      createHorse({}, 1),
      {
        start: { x: 0, z: 0, heading: 0 },
        legs: [{ kind: "straight", length: 40 }],
        cruise: 4,
        acceleration: 3,
        deceleration: 3,
      },
      "trot",
    );
  const forward: ReturnType<typeof rideHorse> = makeRide();
  const reverse: ReturnType<typeof rideHorse> = makeRide();
  const seconds: readonly number[] = [0.5, 1, 2, 4];
  const poses: Map<number, string> = new Map<number, string>();
  for (const time of seconds) poses.set(time, JSON.stringify(forward.at(time)));
  for (const time of [...seconds].reverse())
    TestValidator.equals(
      "reverse query at " + time,
      JSON.stringify(reverse.at(time)),
      poses.get(time)!,
    );
  for (const time of seconds)
    TestValidator.equals(
      "repeat query at " + time,
      JSON.stringify(forward.at(time)),
      poses.get(time)!,
    );
}
