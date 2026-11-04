import assert from "node:assert/strict";

import { LabTransport } from "../../../../src/motion-lab/LabTransport";

/**
 * Preserve exact fractional-millisecond endpoints across URL, direct seek and keyboard.
 * @evidence contracts/testing.md#observable-behavior A duration of .9039999999999999 must be sampled exactly by End, direct seek and an arrow crossing the endpoint. URL bounds use the same numeric endpoint and Home returns to the exact segment start; replay rebases to that start.
 * @evidence contracts/testing.md#independent-cases Exercises full duration and a nonzero URL segment, invalid bounds and unrelated keys. The oracle retains actual evaluator arguments rather than formatted labels or range-input values, catching the former .903 quantization.
 */
export function test_transport_exact_endpoints(): void {
  const duration: number = 0.9039999999999999;
  const samples: number[] = [];
  const full: LabTransport = new LabTransport(
    duration,
    (seconds: number): void => {
      samples.push(seconds);
    },
  );
  assert.equal(full.move("End"), true);
  assert.equal(full.seconds, duration);
  assert.equal(samples.at(-1), duration);
  full.seek(0.903);
  full.move("ArrowRight");
  assert.equal(samples.at(-1), duration);
  full.seek(duration);
  assert.equal(samples.at(-1), duration);
  const bounds: { start: number; end: number } = LabTransport.bounds(
    duration,
    new URLSearchParams({ start: ".103", end: String(duration) }),
  );
  const segment: LabTransport = new LabTransport(
    duration,
    (seconds: number): void => {
      samples.push(seconds);
    },
    bounds,
  );
  segment.move("Home");
  assert.equal(samples.at(-1), 0.103);
  segment.move("ArrowLeft");
  assert.equal(samples.at(-1), 0.103);
  segment.move("End");
  assert.equal(samples.at(-1), duration);
  segment.play();
  assert.equal(samples.at(-1), 0.103);
  assert.equal(segment.playing, true);
  segment.pause();
  const count: number = samples.length;
  assert.equal(segment.move("Tab"), false);
  assert.equal(samples.length, count);
  assert.throws((): void => segment.seek(0.1), /interval/u);
  for (const query of [
    "start=",
    "end=NaN",
    "start=-1",
    "end=1",
    "start=.5&end=.4",
    "start=.3&end=.3",
  ])
    assert.throws((): unknown =>
      LabTransport.bounds(duration, new URLSearchParams(query)),
    );
  assert.deepEqual(LabTransport.bounds(duration, new URLSearchParams()), {
    start: 0,
    end: duration,
  });
}

/**
 * A failed sample pauses without reporting an endpoint that was never evaluated successfully.
 * @evidence contracts/testing.md#observable-behavior Seeks through one working sample followed by a throwing exact endpoint. The clock remains at the last completed evaluator argument and playback is paused; a subsequent valid seek still works.
 * @evidence contracts/testing.md#independent-cases Separates input refusal from evaluator failure and verifies both preserve the committed clock. No actor, renderer or physical success is simulated by this clock-only contract.
 */
export function test_transport_failed_sample(): void {
  const transport: LabTransport = new LabTransport(
    1,
    (seconds: number): void => {
      if (seconds === 1) throw new Error("Unresolved sample");
    },
  );
  transport.seek(0.2);
  transport.play();
  assert.throws((): void => transport.seek(1), /Unresolved sample/u);
  assert.equal(transport.seconds, 0.2);
  assert.equal(transport.playing, false);
  assert.throws((): void => transport.seek(Infinity));
  assert.equal(transport.seconds, 0.2);
  transport.seek(0);
  assert.equal(transport.seconds, 0);
}
