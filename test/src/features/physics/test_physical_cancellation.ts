import assert from "node:assert/strict";

import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Cancellation and yielding share every compute ownership path.
 *
 * Scenarios:
 * 1. Pre-aborted authored, native and identical-cache calls reject their exact reason.
 * 2. Declared yields let an actual host timer run before completion.
 * 3. Progress-triggered and host-triggered aborts expose no successful partial result.
 */
export async function test_physical_cancellation(): Promise<void> {
  const reason: Error = new Error("Caller canceled physical preparation");
  const isReason: (error: unknown) => boolean = (error: unknown): boolean =>
    error === reason;
  for (const kind of ["kinematic", "simulated"] as const) {
    const input: Simulation.IInput = PhysicalFixtures.input(
      [PhysicalFixtures.body("solid", PhysicalFixtures.sphere(), 0.05)],
      0.05,
    );
    input.bodies[0]!.mode = { kind };
    input.yieldEvery = 1;
    const pre: AbortController = new AbortController();
    pre.abort(reason);
    await assert.rejects(
      (): Promise<Simulation> =>
        Simulation.compute(input, undefined, pre.signal),
      isReason,
    );
    let timerFired: boolean = false;
    setTimeout((): void => {
      timerFired = true;
    }, 0);
    const complete: Simulation = await Simulation.compute(input);
    assert.ok(
      timerFired,
      "declared host yields service the actual timer queue",
    );
    await assert.rejects(
      (): Promise<Simulation> =>
        Simulation.compute(input, complete, pre.signal),
      isReason,
    );
    const reuse: AbortController = new AbortController();
    await assert.rejects(
      (): Promise<Simulation> =>
        Simulation.compute(input, complete, reuse.signal, (): void => {
          reuse.abort(reason);
        }),
      isReason,
    );
    const during: AbortController = new AbortController();
    const progress: number[] = [];
    await assert.rejects(
      (): Promise<Simulation> =>
        Simulation.compute(
          input,
          undefined,
          during.signal,
          (completed: number): void => {
            progress.push(completed);
            if (completed === 2) during.abort(reason);
          },
        ),
      isReason,
    );
    assert.ok(progress.includes(2) && !progress.includes(6));
    const host: AbortController = new AbortController();
    setTimeout((): void => {
      host.abort(reason);
    }, 0);
    await assert.rejects(
      (): Promise<Simulation> =>
        Simulation.compute(input, undefined, host.signal),
      isReason,
    );
  }
}
