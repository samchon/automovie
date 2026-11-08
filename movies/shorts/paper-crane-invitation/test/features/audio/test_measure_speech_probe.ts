import assert from "node:assert/strict";

import { measureSpeechProbe } from "../../../src/measureSpeechProbe";

/**
 * Verify exact source duration and amplitude statistics from independently
 * specified PCM codes, and reject a valid WAVE outside the probe profile.
 *
 * @evidence contracts/testing.md#observable-behavior Four signed PCM16 codes independently encode zero, one-half, minus one-half and minus one; duration is four frames divided by 48 kHz, RMS is sqrt(3/8), peak is one and one negative full-scale sample is counted. Changing source rate to 24 kHz must refuse rather than report resampled statistics as original speech. This pure host test proves no listening or actual synthesis.
 * @evidence contracts/testing.md#independent-cases The positive nonempty mono 48 kHz fixture uses specified signed PCM codes and arithmetic expectations rather than decoder output copied into assertions. A structurally valid zero-frame variant checks the public decoder's documented empty-data refusal propagated by this host, and mono 24 kHz checks the host's stricter probe profile. Other decoder RIFF and finite-format cases remain Ingest's responsibility; actual saved synthesis bytes are checked through the script consumer separately.
 */
export function test_measure_speech_probe(): void {
  const bytes: Buffer = Buffer.alloc(52);
  bytes.write("RIFF", 0);
  bytes.writeUInt32LE(44, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(48000, 24);
  bytes.writeUInt32LE(96000, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(8, 40);
  bytes.writeInt16LE(0, 44);
  bytes.writeInt16LE(16384, 46);
  bytes.writeInt16LE(-16384, 48);
  bytes.writeInt16LE(-32768, 50);

  const result: ReturnType<typeof measureSpeechProbe> = measureSpeechProbe(
    bytes,
    "independent-pcm-oracle.wav",
  );
  assert.equal(result.frames, 4);
  assert.equal(result.durationSeconds, 4 / 48000);
  assert.equal(result.sampleRate, 48000);
  assert.equal(result.channels, 1);
  assert.equal(result.peak, 1);
  assert.equal(result.rms, Math.sqrt(3 / 8));
  assert.equal(result.fullScaleSamples, 1);
  assert.match(result.sha256, /^[a-f0-9]{64}$/);

  const empty: Buffer = Buffer.from(bytes.subarray(0, 44));
  empty.writeUInt32LE(36, 4);
  empty.writeUInt32LE(0, 40);
  assert.throws((): void => {
    measureSpeechProbe(empty, "empty.wav");
  }, /\[empty-data\]/);

  bytes.writeUInt32LE(24000, 24);
  bytes.writeUInt32LE(48000, 28);
  assert.throws((): void => {
    measureSpeechProbe(bytes, "wrong-profile.wav");
  }, /Expected nonempty mono 48 kHz candidate/);
}
