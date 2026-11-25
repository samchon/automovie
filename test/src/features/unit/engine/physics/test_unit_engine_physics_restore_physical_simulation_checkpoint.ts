import {
  AutoMoviePhysicsCache,
  AutoMovieXpbdWorld,
  restorePhysicalSimulationCheckpoint,
} from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../../../internal/PhysicalFixtures";

/** The resumed snapshot's interval; the bake has 30 at 120 Hz. */
const START: number = 20;

/**
 * A resume restores each causal ledger as the bake held it at its snapshot, so
 * the resumed run's contacts and records equal a fresh bake's
 * (`restorePhysicalSimulationCheckpoint`).
 *
 * The previous bake holds snapshots every 10 intervals and, past interval 20,
 * one contact episode that ended before it, one open across it that later grew,
 * one that began after it, and a support wrench, a tracking diagnostic and an
 * ownership change on either side of it.
 *
 * Scenarios:
 *
 * 1. Resuming at 20 keeps the snapshots, controller and balance checkpoints up to
 *    20, copied; the recovery state is the one checkpointed at 20.
 * 2. The ended episode is kept as it is; the open one is its checkpointed receipt
 *    with its samples up to 20; the later one is dropped.
 * 3. Support wrenches and diagnostics up to 20 / 120 s and the ownership changes
 *    the checkpoint counted are kept, the later ones dropped.
 */
export function test_unit_engine_physics_restore_physical_simulation_checkpoint(): void {
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input([], 0.25);
  const previous: AutoMoviePhysicsCache = new AutoMoviePhysicsCache(
    "previous",
    input.rate,
    input.duration,
  );
  for (let step: number = 0; step <= 30; step++)
    previous.frames.push({ seconds: step / input.rate, bodies: {} });
  for (const step of [0, 10, 20, 30]) {
    previous.checkpoints.set(
      step,
      step === START
        ? new AutoMovieXpbdWorld(input.gravity).takeSnapshot()
        : new Uint8Array([step]),
    );
    if (step === 0) continue;
    previous.balanceCheckpoints.set(step, {
      ball: {
        last: "supported",
        steps: [],
        offsets: { root: { x: step, y: 0, z: 0 } },
      },
    });
  }
  const sample = (
    seconds: number,
  ): NonNullable<IAutoMovieContactReceipt["samples"]>[number] => ({
    seconds,
    duration: 1 / input.rate,
    impulse: seconds,
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
    separation: 0,
    compression: 0,
  });
  const receipt = (
    id: string,
    seconds: number,
    end: number,
  ): Omit<IAutoMovieContactReceipt, "samples"> => ({
    id,
    source: "solver",
    seconds,
    endSeconds: end,
    a: { body: "floor", bone: "floor", shape: "floor", material: "floor" },
    b: { body: "ball", bone: "root", shape: "surface", material: "solid" },
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
    impulse: end,
    separation: 0,
    compression: 0,
  });
  const ended: IAutoMovieContactReceipt = {
    ...receipt("ended", 1 / 120, 5 / 120),
    samples: [sample(1 / 120), sample(5 / 120)],
  };
  // At interval 20 the open episode had two samples and ended at 20 / 120 s.
  const open: Omit<IAutoMovieContactReceipt, "samples"> = receipt(
    "open",
    12 / 120,
    20 / 120,
  );
  const grown: IAutoMovieContactReceipt = {
    ...open,
    endSeconds: 28 / 120,
    impulse: 28 / 120,
    samples: [12, 20, 24, 28].map((step: number) => sample(step / 120)),
  };
  const later: IAutoMovieContactReceipt = {
    ...receipt("later", 22 / 120, 22 / 120),
    samples: [sample(22 / 120)],
  };
  previous.contacts.push(ended, grown, later);
  for (const step of [10, 20, 30])
    previous.controllerCheckpoints.set(step, {
      contactCount: step === START ? 2 : step === 10 ? 1 : 3,
      episodes: step === START ? [{ receipt: open, sampleCount: 2 }] : [],
      active: [],
      softened: [],
      ownershipCount: step === START ? 1 : 2,
    });
  previous.ownership.push(
    { body: "ball", bone: "root", seconds: 0, kind: "dynamic" },
    { body: "ball", bone: "root", seconds: 25 / 120, kind: "authored" },
  );
  const wrench = (
    seconds: number,
  ): AutoMoviePhysicsCache["supportWrenches"][number] => ({
    body: "ball",
    seconds,
    origin: { x: 0, y: 1, z: 0 },
    requested: {
      force: { x: 0, y: seconds, z: 0 },
      torque: { x: 0, y: 0, z: 0 },
    },
    allocated: {
      force: { x: 0, y: seconds, z: 0 },
      torque: { x: 0, y: 0, z: 0 },
    },
    residual: { force: { x: 0, y: 0, z: 0 }, torque: { x: 0, y: 0, z: 0 } },
    pointCount: 1,
  });
  previous.supportWrenches.push(wrench(START / 120), wrench(21 / 120));
  const diagnostic = (
    seconds: number,
  ): IAutoMoviePhysicalSimulationInput.IDiagnostic => ({
    seconds,
    body: "ball",
    joint: "root",
    error: seconds,
    saturated: [],
  });
  const run: IAutoMoviePhysicalSimulation = {
    input,
    cache: previous,
    recomputedSteps: 30,
    tracking: [diagnostic(START / 120), diagnostic(25 / 120)],
    trackingAt: (): IAutoMoviePhysicalSimulationInput.IDiagnostic[] => [],
  };

  const cache: AutoMoviePhysicsCache = new AutoMoviePhysicsCache(
    "previous",
    input.rate,
    input.duration,
  );
  const diagnostics: IAutoMoviePhysicalSimulationInput.IDiagnostic[] = [];
  restorePhysicalSimulationCheckpoint(input, run, cache, START, diagnostics);
  const sorted = (map: Map<number, unknown>): number[] =>
    [...map.keys()].sort((a: number, b: number): number => a - b);
  TestValidator.equals(
    "the restored ledgers",
    JSON.stringify({
      checkpoints: sorted(cache.checkpoints),
      copied: [...cache.checkpoints].every(
        ([step, bytes]: [number, Uint8Array]): boolean =>
          bytes !== previous.checkpoints.get(step),
      ),
      controller: sorted(cache.controllerCheckpoints),
      balance: sorted(cache.balanceCheckpoints),
      recovery: cache.recovery.ball?.offsets.root?.x ?? null,
      detached:
        cache.recovery.ball !== previous.balanceCheckpoints.get(START)!.ball,
      contacts: cache.contacts.map((contact: IAutoMovieContactReceipt) => ({
        id: contact.id,
        kept: contact === ended,
        endSeconds: contact.endSeconds,
        samples: contact.samples!.map((s): number => s.seconds),
      })),
      wrenches: cache.supportWrenches.map((entry): number => entry.seconds),
      diagnostics: diagnostics.map((entry): number => entry.seconds),
      ownership: cache.ownership.map((entry): number => entry.seconds),
    }),
    JSON.stringify({
      checkpoints: [0, 10, 20],
      copied: true,
      controller: [10, 20],
      balance: [10, 20],
      recovery: START,
      detached: true,
      contacts: [
        {
          id: "ended",
          kept: true,
          endSeconds: 5 / 120,
          samples: [1 / 120, 5 / 120],
        },
        {
          id: "open",
          kept: false,
          endSeconds: 20 / 120,
          samples: [12 / 120, 20 / 120],
        },
      ],
      wrenches: [START / 120],
      diagnostics: [START / 120],
      ownership: [0],
    }),
  );
}
