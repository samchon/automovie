import assert from "node:assert/strict";

import { LabTransport } from "../../../../src/motion-lab/LabTransport";

/**
 * A refused requested action cannot operate a retained previous action's clock.
 *
 * Scenarios:
 * 1. No loaded action explicitly rejects seek and play access.
 * 2. A failed replacement retains the previous clock and evaluator unchanged.
 * 3. A successfully admitted selection uses the original exact seek endpoint.
 *
 * @evidence contracts/testing.md#observable-behavior Executes the same pure admission guard consumed by the browser host, using an actual LabTransport and observable evaluator calls. Absent and refused requests throw before changing time or playback.
 * @evidence contracts/testing.md#independent-cases Literal selection outcomes distinguish a retained old scene from an admitted requested action. The evaluator records exact arguments independently; this unit owns transport authority, while MCP owns actual browser controls and scene presentation.
 */
export function test_host_admission_requested_selection(): void {
  const calls: number[] = [];
  const previous: LabTransport = new LabTransport(
    0.74001,
    (seconds: number): void => {
      calls.push(seconds);
    },
  );
  previous.seek(0.2);
  assert.throws((): void => {
    LabTransport.requireLoaded(undefined, false).seek(0.3);
  }, /No action is loaded/u);
  assert.throws((): void => {
    LabTransport.requireLoaded(previous, false).play();
  }, /requested action was refused/u);
  assert.throws((): void => {
    LabTransport.requireLoaded(previous, false).seek(0.3);
  }, /requested action was refused/u);
  assert.equal(previous.seconds, 0.2);
  assert.equal(previous.playing, false);
  assert.deepEqual(calls, [0.2]);
  const loaded: LabTransport = LabTransport.requireLoaded(previous, true);
  assert.equal(loaded, previous);
  loaded.seek(0.74001);
  assert.deepEqual(calls, [0.2, 0.74001]);
}
