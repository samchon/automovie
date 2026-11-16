import { createHorse, rideHorse } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

/**
 * The SHA-256 digests of the horse's serialised models and ride, recorded before the ox, the camel, the dog and the deer were added beside it (#3496), at eae534bc9.
 */
const RECORDED: Readonly<Record<string, string>> = {
  "saddle 1":
    "bd70c4ba1d4d519a342eb4204950faaafddcc8da1ebc8d59ff207b01e9515145",
  "saddle 2":
    "50483f5f17086402ec3c0aa2e28de01ba45dce79bb016ec7011f0e87c701cd61",
  "saddle 3":
    "a1a58252a14cd1f61843b01a02cc6de9e9e2a8e37bf7d899d94eead7287ac71a",
  "harness 1":
    "6f7da2476f8a74e55021188aa8d618e5404793f0e68bbdacf706ff101d755899",
  "harness 2":
    "4b37d7b80ecda04a6fa4ffb6aa32b58a34f6587aa95cb40dcb40a38efd8a0e9c",
  "harness 3":
    "a314635a0c9163e79b7e45c4003b10ed2f279356ac0312967d8dfb0eda8e56c9",
  "pack 1": "2e0de4ae166128d46b69916cc4c12fd6784afdd3756a54b1ffb49576a802c74a",
  "pack 2": "98e61834470de6f34dd3f56825f125f383b5a03704d5a64e9973e6a56fcf272d",
  "pack 3": "88f647edfba62d72f66d4f5966099bd5d7895582893f9a51851a8f1b8e345663",
  ride: "c41b556fd7aa9d67a60dd42b42125e45c6db6f2a63ebed60bc3c70e20ba7e3d9",
};

/**
 * The horse and its ride stay what they were when the other quadrupeds were built beside them on the shared body, gait table and ride.
 *
 * Scenarios:
 * 1. `createHorse` under its saddle, its harness and its pack saddle at seeds 1 to 3 serialises bit-identically to the digests recorded before the new species: its parts, contacts, dimensions and mass.
 * 2. `rideHorse` of that saddled horse at seed 1, trotting a 40 m straight at 4 m/s, serialises bit-identically at 0.5, 1, 2 and 4 seconds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the horse and its ride on fixed inputs and compares their serialised digests; any change to a horse's part, contact, dimension, mass or pose, or to the shared code under it, is caught.
 * @evidence contracts/development/testing.md#independent-expectations The digests were recorded from the horse as it stood before the new species were added, not computed by the code under test now.
 * @evidence contracts/development/testing.md#distinguishing-cases Three tacks at three seeds, and a ride sampled at four seconds.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_animal_horse_unchanged(): void {
  const digest = (value: unknown): string =>
    createHash("sha256").update(JSON.stringify(value)).digest("hex");
  const found: Record<string, string> = {};
  for (const tack of ["saddle", "harness", "pack"] as const)
    for (const seed of [1, 2, 3]) {
      const horse: ReturnType<typeof createHorse> = createHorse({ tack }, seed);
      found[`${tack} ${seed}`] = digest({
        parts: horse.parts,
        affordances: horse.affordances,
        dimensions: horse.dimensions,
        mass: horse.body.mass,
      });
    }
  const ride: ReturnType<typeof rideHorse> = rideHorse(
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
  found.ride = digest(
    [0.5, 1, 2, 4].map((seconds: number): unknown => ride.at(seconds)),
  );
  TestValidator.equals("the horse is unchanged", found, RECORDED);
}
