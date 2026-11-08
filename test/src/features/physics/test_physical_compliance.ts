import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { PhysicalFixtures as Fixtures } from "../internal/PhysicalFixtures";

/** Real two-body contact sweep.
 *
 * Scenarios:
 * 1. A glancing air gap produces no contact impulse or target displacement.
 * 2. Low and high incident speeds both reach the compliant surface.
 * 3. Greater speed increases measured impulse, compression and receiving velocity.
 * 4. Independent soft runs retain identical frames and per-step receipts.
 */
export async function test_physical_compliance(): Promise<void> {
  const observations: {
    speed: number;
    impulse: number;
    compression: number;
    velocity: number;
  }[] = [];
  for (const speed of [1, 4]) {
    const profile: P = Fixtures.sphere(0.1, 0.001);
    const a: Simulation.IBody = Fixtures.body("striker", profile, 1, {
      position: { x: -0.3, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    });
    const b: Simulation.IBody = Fixtures.body("receiver", profile, 1, {
      position: { x: 0.3, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    });
    const input: Simulation.IInput = Fixtures.input([a, b], 1);
    input.impulses.push({
      step: 1,
      body: "striker",
      bone: "root",
      point: { x: -0.3, y: 1, z: 0 },
      impulse: { x: speed, y: 0, z: 0 },
    });
    const run: Simulation = await Simulation.compute(input);
    const contacts: IAutoMovieContactReceipt[] = run.cache.contacts.filter(
      (receipt: (typeof run.cache.contacts)[number]): boolean =>
        receipt.a.body !== "floor" && receipt.b.body !== "floor",
    );
    TestValidator.predicate(
      `speed ${speed} has actual solved contact`,
      contacts.length > 0 &&
        contacts.every(
          (receipt: (typeof contacts)[number]): boolean =>
            receipt.source === "solver" &&
            receipt.samples!.length > 0 &&
            receipt.impulse! > 0 &&
            receipt.separation <= 0,
        ),
    );
    observations.push({
      speed,
      impulse: contacts.reduce(
        (sum: number, receipt: IAutoMovieContactReceipt): number =>
          sum + receipt.impulse!,
        0,
      ),
      compression: Math.max(
        ...contacts.map(
          (receipt: (typeof contacts)[number]): number => receipt.compression,
        ),
      ),
      velocity: run.cache.at(1).bodies.receiver!.root!.velocity.x,
    });
    if (speed === 1) {
      const repeat: Simulation = await Simulation.compute(input);
      TestValidator.equals(
        "soft solver deterministic frames and contacts",
        JSON.stringify([run.cache.frames, run.cache.contacts]),
        JSON.stringify([repeat.cache.frames, repeat.cache.contacts]),
      );
      const miss: Simulation.IInput = structuredClone(input);
      for (const target of miss.bodies[1]!.targets)
        target.segments.root!.position.z = 0.21;
      const air: Simulation = await Simulation.compute(miss);
      TestValidator.predicate(
        "air gap creates no receipt or reaction",
        air.cache.contacts.length === 0 &&
          Math.abs(air.cache.at(1).bodies.receiver!.root!.velocity.x) < 1e-8,
      );
    }
  }
  TestValidator.predicate(
    "speed sweep changes real impulse compression and displacement",
    observations[1]!.impulse > observations[0]!.impulse &&
      observations[1]!.compression > observations[0]!.compression &&
      observations[1]!.velocity > observations[0]!.velocity &&
      observations[0]!.compression > 0,
  );
}
