import {
  AutoMoviePhysicsCache,
  AutoMovieXpbdWorld,
  type IAutoMoviePhysicalBinding,
  capturePhysicalSimulationCheckpoint,
  restorePhysicalSimulationCheckpoint,
} from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalControllerCheckpoint,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/**
 * A captured checkpoint restores the run as it stood when it was captured,
 * whatever the run did after (`capturePhysicalSimulationCheckpoint`, then
 * `restorePhysicalSimulationCheckpoint`).
 *
 * A hand-written run of one body at 120 Hz: one contact episode ends before
 * step 10, a second opens after it and is still open at step 20, and the
 * ownership ledger, recovery state, softened tracking and the binding's release
 * set and recovery plan change between the steps. After step 20 the open
 * episode gains samples and ends later, a third episode opens, ownership and
 * recovery change again and the binding's plan and release set move.
 *
 * Scenarios:
 *
 * 1. Restoring the checkpoint captured at step 10, with no episode open, gives the
 *    contacts, ownership and recovery state as they stood at step 10.
 * 2. Restoring the one captured at 20, mid-episode, gives them as they stood at
 *    20: the open episode with its end and its samples at 20 only.
 * 3. The controller record restored at 20 holds the open pair, the softened
 *    tracking, the release set and the recovery plan as they stood at 20.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the run's history around both captures and what each restore must give.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `capturePhysicalSimulationCheckpoint` at two steps of an in-memory run, changes the run as later steps would, then calls `restorePhysicalSimulationCheckpoint` at each and reads the cache it fills.
 * @evidence contracts/development/testing.md#independent-expectations Each expectation is the test's own copy of the run's state taken at the capture, before any later change; nothing the capture wrote is read back as its own expectation.
 * @evidence contracts/development/testing.md#distinguishing-cases A checkpoint with no open episode and one mid-episode, with every captured part changed afterwards; a capture that kept a reference instead of a copy, counted a ledger after the step or left an open episode's later samples in fails. Choosing the checkpoint is `test_physical_checkpoint_resume`'s, the restored ledgers' cut `test_physical_checkpoint_ledgers`' and the restored world `test_physical_snapshot_resume`'s.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation over in-memory data and one empty solver world's snapshot; no world is stepped and no simulation, viewer or file host runs.
 */
export function test_physical_checkpoint_capture(): void {
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input([], 0.25);
  const cache: AutoMoviePhysicsCache = new AutoMoviePhysicsCache(
    "previous",
    input.rate,
    input.duration,
  );
  for (let step: number = 0; step <= 30; step++)
    cache.frames.push({ seconds: step / input.rate, bodies: {} });
  const world: AutoMovieXpbdWorld = new AutoMovieXpbdWorld(input.gravity);
  const planned: Map<string, unknown> = new Map([["ball", { marker: 10 }]]);
  const released: Set<string> = new Set();
  // The binding's parts a checkpoint keeps; the run's other parts are not read.
  const bound: IAutoMoviePhysicalBinding = {
    released,
    contactReleased: new Set<string>(),
    planned,
    supportPlanned: new Map(),
    contactTargets: new Map(),
    handoffs: new Map(),
  } as unknown as IAutoMoviePhysicalBinding;
  const active: Map<string, IAutoMovieContactReceipt> = new Map();
  const softened: Map<string, number> = new Map();
  const capture = (step: number): void =>
    capturePhysicalSimulationCheckpoint({
      cache,
      world,
      bound,
      active,
      softened,
      step,
    });
  const state = (): string =>
    JSON.stringify({
      contacts: cache.contacts,
      ownership: cache.ownership,
      recovery: cache.recovery,
    });

  // Up to step 10: one episode that has ended, nothing open.
  cache.contacts.push(receipt("ended", [2, 5]));
  cache.ownership.push({
    body: "ball",
    bone: "root",
    seconds: 0,
    kind: "dynamic",
  });
  cache.recovery.ball = { last: "supported", steps: [], offsets: {} };
  capture(10);
  const ten: string = state();

  // Up to step 20: a second episode opens and stays open.
  const open: IAutoMovieContactReceipt = receipt("open", [12, 20]);
  cache.contacts.push(open);
  active.set("floor/ball", open);
  softened.set("ball/root", 0.3);
  released.add("ball");
  planned.set("ball", { marker: 20 });
  cache.ownership.push({
    body: "ball",
    bone: "root",
    seconds: 0.15,
    kind: "return",
  });
  cache.recovery.ball.offsets = { root: { x: 0.1, y: 0, z: 0 } };
  capture(20);
  const twenty: string = state();

  // After step 20, as later steps would.
  open.samples!.push(sample(24), sample(28));
  open.endSeconds = 28 / 120;
  cache.contacts.push(receipt("later", [26]));
  cache.ownership.push({
    body: "ball",
    bone: "root",
    seconds: 0.2,
    kind: "authored",
  });
  cache.recovery.ball.last = "recovery";
  cache.recovery.ball.offsets.root!.x = 0.5;
  planned.set("ball", { marker: 99 });
  released.add("other");
  softened.set("ball/root", 0.9);

  const run: IAutoMoviePhysicalSimulation = {
    input,
    cache,
    recomputedSteps: 30,
    tracking: [],
    trackingAt: (): IAutoMoviePhysicalSimulationInput.IDiagnostic[] => [],
  };
  const restore = (start: number): AutoMoviePhysicsCache => {
    const restored: AutoMoviePhysicsCache = new AutoMoviePhysicsCache(
      "previous",
      input.rate,
      input.duration,
    );
    restorePhysicalSimulationCheckpoint(input, run, restored, start, []);
    return restored;
  };
  const atTen: AutoMoviePhysicsCache = restore(10);
  const atTwenty: AutoMoviePhysicsCache = restore(20);
  const record: IAutoMoviePhysicalControllerCheckpoint =
    atTwenty.controllerCheckpoints.get(20)!;
  TestValidator.equals(
    "a restored capture is the run as it stood",
    {
      ten: JSON.stringify({
        contacts: atTen.contacts,
        ownership: atTen.ownership,
        recovery: atTen.recovery,
      }),
      twenty: JSON.stringify({
        contacts: atTwenty.contacts,
        ownership: atTwenty.ownership,
        recovery: atTwenty.recovery,
      }),
      record: JSON.stringify({
        active: record.active,
        softened: record.softened,
        released: record.released,
        balanceTargets: record.balanceTargets,
      }),
    },
    {
      ten,
      twenty,
      record: JSON.stringify({
        active: [["floor/ball", "open"]],
        softened: [["ball/root", 0.3]],
        released: ["ball"],
        balanceTargets: { ball: { marker: 20 } },
      }),
    },
  );
}

/** A solver episode between the floor and the ball, sampled at these steps. */
function receipt(id: string, steps: number[]): IAutoMovieContactReceipt {
  return {
    id,
    source: "solver",
    seconds: steps[0]! / 120,
    endSeconds: steps.at(-1)! / 120,
    a: { body: "floor", bone: "floor", shape: "floor", material: "floor" },
    b: { body: "ball", bone: "root", shape: "surface", material: "solid" },
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
    impulse: steps.length,
    separation: 0,
    compression: 0,
    samples: steps.map(sample),
  };
}

/** One completed step's sample at a 120 Hz step. */
function sample(
  step: number,
): NonNullable<IAutoMovieContactReceipt["samples"]>[number] {
  return {
    seconds: step / 120,
    duration: 1 / 120,
    impulse: step,
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
    separation: 0,
    compression: 0,
  };
}
