import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Cancellation and yielding share every compute ownership path.
 *
 * Scenarios:
 * 1. Pre-aborted authored, native and identical-cache calls reject their exact reason.
 * 2. Declared yields let an actual host timer run before completion.
 * 3. Progress-triggered and host-triggered aborts expose no successful partial result.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation` on in-memory inputs and asserts the returned observations through no assertion call; 3 numbered scenarios (first: Pre-aborted authored, native and identical-cache calls reject their exact reason.; last: Progress-triggered and host-triggered aborts expose no successful partial result.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: Pre-aborted authored, native and identical-cache calls reject their exact reason.; last: Progress-triggered and host-triggered aborts expose no successful partial result.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_cancellation`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Pre-aborted authored, native and identical-cache calls reject their exact reason.).
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
