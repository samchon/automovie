import {
  AutoMoviePhysicsCache as Cache,
  AutoMoviePhysicalPlayback as Playback,
  AutoMoviePhysicalSimulation as Simulation,
  physicalInputDigest,
  samplePhysicalRecoverySupport,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** A Node-computed archive replays the same performance without stepping a solver.
 *
 * Scenarios:
 * 1. Every sampled and fractional seek equals the original cached state exactly.
 * 2. Contact measurements and normalized input identity survive the archive.
 * 3. Decoding owns its bytes, so a caller's later mutation cannot change playback.
 * 4. Stale identities, corruption, truncation and declared allocation overflows refuse.
 * 5. Recovery histories require chronological steps, landings and handoffs; early cancellation remains distinct from early claimed landing/failure.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalPlayback`, `AutoMoviePhysicalSimulation`, `AutoMoviePhysicsCache`, `physicalInputDigest` on in-memory inputs and asserts the returned observations through 5x TestValidator.equals; 5 numbered scenarios (first: Every sampled and fractional seek equals the original cached state exactly.; last: Recovery histories require chronological steps, landings and handoffs; early cancellation remains distinct...). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (2 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 5 numbered scenarios (first: Every sampled and fractional seek equals the original cached state exactly.; last: Recovery histories require chronological steps, landings and handoffs; early cancellation remains distinct...), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_playback_archive`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Every sampled and fractional seek equals the original cached state exactly.).
 */
export async function test_physical_playback_archive(): Promise<void> {
  const input: Simulation.IInput = PhysicalFixtures.input(
    [PhysicalFixtures.body("ball", PhysicalFixtures.sphere(), 2)],
    2,
  );
  input.floor = 0;
  input.gravity.y = -9.81;
  const simulation: Simulation = await Simulation.compute(input);
  const bytes: Uint8Array = await Playback.encode(simulation.cache, 1_000_000);
  const budget: {
    maximumBytes: number;
    maximumFrames: number;
    maximumSegments: number;
  } = { maximumBytes: 1_000_000, maximumFrames: 241, maximumSegments: 1 };
  const playback: Playback = await Playback.decode(
    bytes,
    physicalInputDigest(input),
    budget,
  );
  for (const seconds of [1.72, 0, 2, 0.001, 1 / 120, 0.75])
    TestValidator.equals(
      `archive seek ${seconds}`,
      JSON.stringify(playback.at(seconds)),
      JSON.stringify(simulation.cache.at(seconds)),
    );
  TestValidator.equals(
    "causal contact history survives",
    JSON.stringify(playback.contacts),
    JSON.stringify(simulation.cache.contacts),
  );
  bytes[bytes.length - 33] = bytes[bytes.length - 33]! ^ 1;
  TestValidator.equals(
    "decoded bytes are independently owned",
    JSON.stringify(playback.at(1.72)),
    JSON.stringify(simulation.cache.at(1.72)),
  );
  const valid: Uint8Array = await Playback.encode(simulation.cache, 1_000_000);
  const cases: (() => Promise<unknown>)[] = [
    (): Promise<unknown> =>
      Playback.decode(valid, `sha256:${"0".repeat(64)}`, budget),
    (): Promise<unknown> =>
      Playback.decode(bytes, simulation.cache.identity, budget),
    (): Promise<unknown> =>
      Playback.decode(
        valid.subarray(0, valid.length - 1),
        simulation.cache.identity,
        budget,
      ),
    (): Promise<unknown> =>
      Playback.decode(valid, simulation.cache.identity, {
        ...budget,
        maximumBytes: valid.length - 1,
      }),
    (): Promise<unknown> =>
      Playback.decode(valid, simulation.cache.identity, {
        ...budget,
        maximumFrames: 240,
      }),
    (): Promise<unknown> => Playback.encode(simulation.cache, valid.length - 1),
  ];
  const findings: string[] = [];
  for (const [index, attempt] of cases.entries()) {
    try {
      await attempt();
      findings.push(`Malformed archive case ${index} was accepted`);
    } catch {}
  }
  // A valid SHA trailer proves byte integrity, not metadata semantics. These
  // producer fixtures deliberately retain the expected input identity while
  // supplying causal rows that would crash or mislead the real overlay.
  const mutations: ((cache: Cache) => void)[] = [
    (cache: Cache): void => {
      cache.contacts[0]!.samples![0]!.appliedImpulse = { a: -1, b: 0 };
    },
    (cache: Cache): void => {
      cache.contacts[0]!.samples![0]!.appliedImpulse = { a: 0, b: Infinity };
    },
    (cache: Cache): void => {
      Reflect.set(cache.contacts[0]!.samples![0]!, "appliedImpulse", []);
    },
    (cache: Cache): void => {
      cache.contacts[0]!.normal = { x: 0, y: 0, z: 0 };
    },
    (cache: Cache): void => {
      cache.contacts[0]!.endSeconds = 3;
    },
    (cache: Cache): void => {
      cache.contacts[0]!.a.bone = "absent-owner";
    },
    (cache: Cache): void => {
      cache.contacts[0]!.impulse = -1;
    },
    (cache: Cache): void => {
      cache.contacts[0]!.samples![0]!.duration = 0;
    },
    (cache: Cache): void => {
      cache.contacts[0]!.source = "geometric";
      cache.contacts[0]!.impulse = null;
    },
    (cache: Cache): void => {
      cache.contacts.push(structuredClone(cache.contacts[0]!));
    },
    (cache: Cache): void => {
      cache.recovery.ball = {
        last: "supported",
        steps: [],
        offsets: { absent: { x: 0, y: 0, z: 0 } },
      };
    },
  ];
  // This independent DTO tests codec semantics, not a claim that the falling
  // ball performed these recovery motions. Its values deliberately separate
  // the latest root offset from the latest endpoint offset.
  const recovery: Cache["recovery"][string] = {
    last: "supported",
    offsets: {},
    rootOffset: { x: 0.2, y: 0, z: 0 },
    steps: [0.2, 0.6].map(
      (start: number): Cache["recovery"][string]["steps"][number] => ({
        bone: "root",
        kind: "swing",
        start,
        end: start + 0.1,
        from: { point: [0, 0], yaw: 0, pitch: 0, clearance: 0 },
        to: { point: [0.1, 0], yaw: 0, pitch: 0, clearance: 0 },
        resolved: { seconds: start + 0.11, status: "landed" },
      }),
    ),
    landings: [0.31, 0.71].map(
      (
        seconds: number,
        index: number,
      ): NonNullable<Cache["recovery"][string]["landings"]>[number] => ({
        bone: "root",
        seconds,
        position: { x: 0.1, y: 0, z: 0 },
        offset: { x: index === 0 ? 0.1 : 0.3, y: 0, z: 0 },
        rootOffset: { x: index === 0 ? 0.1 : 0.2, y: 0, z: 0 },
      }),
    ),
    handoffs: [
      { bone: "root", seconds: 0.4 },
      { bone: "root", seconds: 0.9 },
    ],
  };
  /** Own only codec metadata; the existing numeric frame stream is borrowed unchanged. */
  const copy: () => Cache = (): Cache => {
    const cache: Cache = new Cache(simulation.cache.identity, 120, 2);
    cache.frames.push(...simulation.cache.frames);
    cache.contacts.push(...structuredClone(simulation.cache.contacts));
    cache.ownership.push(...structuredClone(simulation.cache.ownership));
    cache.supportWrenches.push(
      ...structuredClone(simulation.cache.supportWrenches),
    );
    cache.recovery.ball = structuredClone(recovery);
    return cache;
  };
  const ordered: Playback = await Playback.decode(
    await Playback.encode(copy(), 1_000_000),
    simulation.cache.identity,
    budget,
  );
  TestValidator.equals(
    "latest admitted landing retains its independent endpoint offset",
    samplePhysicalRecoverySupport(ordered.recovery.ball, "root", 0.8).offset.x,
    0.3,
  );
  const cancelled: Cache = copy();
  cancelled.recovery.ball!.steps[0]!.resolved = {
    seconds: 0.25,
    status: "cancelled",
  };
  cancelled.recovery.ball!.landings!.shift();
  cancelled.recovery.ball!.handoffs!.shift();
  await Playback.decode(
    await Playback.encode(cancelled, 1_000_000),
    simulation.cache.identity,
    budget,
  );
  for (const kind of [
    "steps",
    "landings",
    "handoffs",
    "early-landing",
    "early-failure",
  ] as const) {
    const cache: Cache = copy();
    if (kind === "steps") cache.recovery.ball!.steps.reverse();
    else if (kind === "landings") cache.recovery.ball!.landings!.reverse();
    else if (kind === "handoffs") cache.recovery.ball!.handoffs!.reverse();
    else
      cache.recovery.ball!.steps[0]!.resolved = {
        seconds: 0.25,
        status: kind === "early-landing" ? "landed" : "failed",
      };
    try {
      await Playback.decode(
        await Playback.encode(cache, 1_000_000),
        simulation.cache.identity,
        budget,
      );
      findings.push(`Noncausal recovery history ${kind} was accepted`);
    } catch {}
  }
  for (const [index, mutate] of mutations.entries()) {
    const malformed: Cache = new Cache(simulation.cache.identity, 120, 2);
    malformed.frames.push(...simulation.cache.frames);
    malformed.contacts.push(...structuredClone(simulation.cache.contacts));
    malformed.ownership.push(...structuredClone(simulation.cache.ownership));
    malformed.supportWrenches.push(
      ...structuredClone(simulation.cache.supportWrenches),
    );
    mutate(malformed);
    const encoded: Uint8Array = await Playback.encode(malformed, 1_000_000);
    try {
      await Playback.decode(encoded, simulation.cache.identity, budget);
      findings.push(
        `Integrity-valid malformed metadata case ${index} was accepted`,
      );
    } catch {}
  }
  TestValidator.equals("all archive refusals", findings, []);
}
