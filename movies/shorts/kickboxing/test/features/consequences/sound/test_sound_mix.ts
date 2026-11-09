import assert from "node:assert/strict";

import { SoundMix } from "../../../../src/consequences/sound/SoundMix";

/**
 * The mix measurement reads a PCM16 WAV and gives each word's rise over the
 * bed before it.
 *
 * Scenarios: a stereo 16-bit WAV with an extra chunk before `data` reads as
 * its averaged mono samples at its rate; on a synthetic mix of a bed at
 * amplitude 0.01 and two words at 0.1 one second apart, each word rises
 * 20 dB, the second's bed leaving out the first word's tail; effects are
 * not words.
 */
export function test_sound_mix(): void {
  const rate: number = 1000;
  const frames: number = 4;
  const bytes = new Uint8Array(12 + 24 + 12 + 8 + frames * 4);
  const view = new DataView(bytes.buffer);
  const tag = (at: number, text: string): void =>
    [...text].forEach((ch, k) => view.setUint8(at + k, ch.charCodeAt(0)));
  tag(0, "RIFF");
  view.setUint32(4, bytes.length - 8, true);
  tag(8, "WAVE");
  tag(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  tag(36, "LIST");
  view.setUint32(40, 4, true);
  tag(48, "data");
  view.setUint32(52, frames * 4, true);
  [16384, 0, -16384, -16384, 0, 0, 8192, 8192].forEach((v, k) =>
    view.setInt16(56 + 2 * k, v, true),
  );
  const read = SoundMix.read(bytes);
  assert.equal(read.sampleRate, rate);
  assert.deepEqual([...read.samples], [0.25, -0.5, 0, 0.25]);

  const samples = new Float32Array(4 * rate).fill(0.01);
  samples.fill(0.1, 1 * rate, 1.8 * rate);
  samples.fill(0.1, 2 * rate, 2.6 * rate);
  const rises = SoundMix.words({ sampleRate: rate, samples }, [
    { asset: "count1", seconds: 1, durationSeconds: 0.8 },
    { asset: "count2", seconds: 2, durationSeconds: 0.6 },
    { asset: "punch1", seconds: 3, durationSeconds: 0.3 },
  ]);
  assert.deepEqual(rises.map((r) => r.asset), ["count1", "count2"]);
  for (const r of rises) assert.ok(Math.abs(r.rise - 20) < 1e-3, `${r.asset} ${r.rise}`);
}
