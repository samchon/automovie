import assert from "node:assert/strict";

import { createPerformanceClock } from "../../../src/createPerformanceClock";

/**
 * Protect the commissioned one-minute output interval and deterministic seeks.
 *
 * @evidence contracts/testing.md#observable-behavior Executes the real Engine-backed clock and checks 1440 frames at 24 fps, first/last frame local times, exclusive endpoint refusal and nonsequential replay equality. It catches frame loss, inclusive-end capture and retained-time state; it proves no rendered motion.
 * @evidence contracts/testing.md#independent-cases Sixty seconds and twenty-four frames per second come from the delivery requirement; their product and last index1439 define expectations independently. Negative/nonfinite time, final boundary, zero rate and fractional frame count cover host admission. Engine owns general trim/transition tests because this host has one continuous shot.
 */
export function test_performance_clock(): void {
  const clock: ReturnType<typeof createPerformanceClock> = createPerformanceClock(60, 24);
  assert.equal(clock.duration, 60);
  assert.equal(clock.frames, 1440);
  assert.equal(clock.sample(0).time, 0);
  assert.equal(clock.sample(1439 / 24).time, 1439 / 24);
  const before: ReturnType<typeof clock.sample> = clock.sample(8.5);
  clock.sample(45); clock.sample(0); clock.sample(59);
  assert.deepEqual(clock.sample(8.5), before);
  assert.equal(before.blend, null);
  for (const time of [-1, 60, Infinity, NaN])
    assert.throws((): void => { clock.sample(time); }, /Performance time/);
  assert.throws((): void => { createPerformanceClock(60, 0); }, /Performance clock/);
  assert.throws((): void => { createPerformanceClock(0.01, 24); }, /integral frames/);
}
