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
 *
 * @evidence contracts/development/testing.md#behavioral-verification Constructs actual horses and rides and compares repeated serialized results after interleaved construction and reversed time queries; random state that depends on another construction or an order-dependent playback cursor fails. Returned-object aliasing is not checked.
 * @evidence contracts/development/testing.md#independent-expectations The product contract requires deterministic output for fixed inputs, so independent executions and query permutations must agree byte for byte. No recorded output is an oracle. This relation checks replay, while the horse ride tests own anatomical, stride and planted-hoof accuracy.
 * @evidence contracts/development/testing.md#distinguishing-cases All four tacks, three seeds, independent rides, forward and reverse query orders and a repeated read after advancing the first ride distinguish construction state from playback state.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable unit test over in-memory models and paths; no host, process or renderer starts.
 * @evidence contracts/development/common.md#meaningful-documentation States the deterministic construction and playback contract, the three scenarios and the physical properties this relational oracle does not decide.
 */
export function test_archetype_horse_replay(): void {
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
