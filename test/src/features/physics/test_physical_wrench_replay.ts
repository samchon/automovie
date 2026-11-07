import { TestValidator } from "@nestia/e2e";

import { AutoMoviePhysicalPlayback as Playback } from "../../../../packages/engine/src/physics/AutoMoviePhysicalPlayback";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";

/** Virtual support demand remains distinguishable from achieved native contact force through restart and solver-free playback.
 *
 * Scenarios:
 * 1. Unsupported weight compensation retains requested force and zero allocated force without inventing an impulse.
 * 2. An edited suffix resumes exact allocation diagnostics from a native checkpoint.
 * 3. Binary replay retains those predictions and rejects inconsistent integrity-valid residual metadata.
 */
export async function test_physical_wrench_replay(): Promise<void> {
  const body: Simulation.IBody = PhysicalSupportFixtures.body(
    PhysicalModelFixtures.quadrupod(),
    1,
  );
  body.actuation = "internal";
  body.compensateGravity = true;
  const input: Simulation.IInput = PhysicalFixtures.input([body], 1);
  Object.assign(input, {
    gravity: { x: 0, y: -9.81, z: 0 },
    substeps: 4,
    iterations: 16,
  });
  const baseline: Simulation = await Simulation.compute(input);
  TestValidator.predicate(
    "unsupported demand remains a prediction with residual",
    baseline.cache.supportWrenches.some(
      (entry: (typeof baseline.cache.supportWrenches)[number]): boolean =>
        entry.pointCount === 0 &&
        entry.requested.force.y > 0 &&
        entry.allocated.force.y === 0 &&
        entry.residual.force.y === entry.requested.force.y,
    ),
  );
  TestValidator.predicate(
    "the allocation creates no floor contact receipt",
    !baseline.cache.contacts.some(
      (receipt: (typeof baseline.cache.contacts)[number]): boolean =>
        receipt.a.body === "floor" || receipt.b.body === "floor",
    ),
  );
  const changed: Simulation.IInput = structuredClone(input);
  changed.impulses.push({
    step: 90,
    body: body.id,
    bone: "body",
    impulse: { x: 0.1, y: 0, z: 0 },
    point: { x: 0, y: 0.8, z: 0 },
  });
  const fresh: Simulation = await Simulation.compute(changed);
  const resumed: Simulation = await Simulation.compute(changed, baseline);
  TestValidator.equals(
    "allocation diagnostics resume exactly",
    JSON.stringify(resumed.cache.supportWrenches),
    JSON.stringify(fresh.cache.supportWrenches),
  );
  const bytes: Uint8Array = await Playback.encode(fresh.cache, 2_000_000);
  const playback: Playback = await Playback.decode(
    bytes,
    fresh.cache.identity,
    { maximumBytes: 2_000_000, maximumFrames: 121, maximumSegments: 13 },
  );
  TestValidator.equals(
    "predictions survive binary replay",
    JSON.stringify(playback.supportWrenches),
    JSON.stringify(fresh.cache.supportWrenches),
  );
  const metadataBytes: number = new DataView(
    bytes.buffer,
    bytes.byteOffset,
  ).getUint32(4, true);
  const header: Playback.IHeader = JSON.parse(
    new TextDecoder().decode(bytes.subarray(8, 8 + metadataBytes)),
  );
  header.supportWrenches[0]!.residual.force.y += 1;
  const changedMetadata: Uint8Array = new TextEncoder().encode(
    JSON.stringify(header),
  );
  const oldOffset: number = Math.ceil((8 + metadataBytes) / 8) * 8;
  const newOffset: number = Math.ceil((8 + changedMetadata.length) / 8) * 8;
  const malformed: Uint8Array<ArrayBuffer> = new Uint8Array(
    newOffset + bytes.length - oldOffset,
  );
  new DataView(malformed.buffer).setUint32(0, 0x414d5031, true);
  new DataView(malformed.buffer).setUint32(4, changedMetadata.length, true);
  malformed.set(changedMetadata, 8);
  malformed.set(bytes.subarray(oldOffset, bytes.length - 32), newOffset);
  malformed.set(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        malformed.subarray(0, malformed.length - 32),
      ),
    ),
    malformed.length - 32,
  );
  let refused: boolean = false;
  try {
    await Playback.decode(malformed, fresh.cache.identity, {
      maximumBytes: 2_000_000,
      maximumFrames: 121,
      maximumSegments: 13,
    });
  } catch (error) {
    refused =
      error instanceof Error && error.message.includes("allocation residual");
  }
  TestValidator.predicate(
    "an integrity trailer cannot authorize a false residual",
    refused,
  );
}
