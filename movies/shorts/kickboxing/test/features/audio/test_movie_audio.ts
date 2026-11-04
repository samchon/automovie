import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { FilmPlan } from "../../../src/film/FilmPlan";
import { AudioMix } from "../../../src/audio/AudioMix";
import { AudioPcm } from "../../../src/audio/AudioPcm";
import { MovieAudioAssets } from "../../../src/audio/MovieAudioAssets";

/**
 * Impacts require exact participants and receipts; actual arrival replaces intent.
 *
 * Scenarios:
 * 1. Actual hit and mat times replace their distinct nominal times; a miss has air only.
 * 2. Ten English count cues occupy the commissioned absolute clock.
 * 3. Missing interceptions omit impacts; duplicate, orphan and mismatched receipts refuse.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the real pure cue compiler with deliberately distinct planned/observed times, a miss, a mat arrival and ten referee counts. It checks absent-hit omission, duplicate, orphan and wrong-participant refusals and input immutability. These fabricated unit receipts do not prove scene contact or audible quality.
 * @evidence contracts/testing.md#independent-cases The commission supplies ten counts at 158 through 167 and a 180-second cutoff. The fixture's observed 9.93-second contact and 150.83-second hip arrival are independent inputs; retaining nominal 10/150.9 would fail. Negative cases change receipt identity or actor rather than weakening a physical tolerance.
 */
export function test_movie_audio_receipts_and_clock(): void {
  const events: FilmPlan.Event[] = [
    { id: "jab:contact", seconds: 10, kind: "contact", actorId: "a", targetId: "b", actionId: "jab", relation: "guard", requiresContact: "jab" },
    { id: "cross:miss", seconds: 11, kind: "miss", actorId: "b", actionId: "cross" },
    { id: "down-hip", seconds: 150.9, kind: "fall", actorId: "b" },
    ...Array.from({ length: 10 }, (_: unknown, index: number): FilmPlan.Event => ({ id: `count-${index + 1}`, seconds: 158 + index, kind: "count", actorId: "referee", count: index + 1 })),
    { id: "decision", seconds: 167.6, durationSeconds: 2.3, kind: "decision", actorId: "referee" },
    { id: "closing-bell", seconds: 170.1, kind: "bell", actorId: "referee" },
  ];
  const contact: AudioMix.Contact = { eventId: "jab:contact", actionId: "jab", actorId: "a", targetId: "b", seconds: 9.93, relation: "guard", provenance: "Independent unit receipt; not actual scene geometry" };
  const floor: AudioMix.FloorContact = { eventId: "down-hip", actorId: "b", seconds: 150.83, bodyPart: "hip", provenance: "Independent unit floor fixture; not actual fitted geometry" };
  const before: string = JSON.stringify({ events, contact, floor });
  const cues: AudioMix.Cue[] = AudioMix.build(events, [contact], [floor]);
  assert.equal(cues.find((cue: AudioMix.Cue): boolean => cue.id === "jab:contact")?.seconds, 9.93);
  assert.equal(cues.find((cue: AudioMix.Cue): boolean => cue.id === "down-hip")?.seconds, 150.83);
  assert.equal(cues.find((cue: AudioMix.Cue): boolean => cue.id === "cross:miss")?.source, "air");
  assert.equal(cues.filter((cue: AudioMix.Cue): boolean => cue.source.startsWith("count")).length, 10);
  assert.equal(cues.find((cue: AudioMix.Cue): boolean => cue.source === "count10")?.seconds, 167);
  assert.equal(cues.find((cue: AudioMix.Cue): boolean => cue.source === "decision")?.durationSeconds, 2.3);
  assert.equal(cues.find((cue: AudioMix.Cue): boolean => cue.id === "closing-bell")?.seconds, 170.1);
  assert.equal(cues.filter((cue: AudioMix.Cue): boolean => cue.contactId === "jab:contact").length, 1);
  assert.equal(AudioMix.build([{ ...events[0], relation: undefined }], [{ ...contact, relation: "body" }])[0].source, "punch5");
  assert.equal(AudioMix.build(events, [], [floor]).filter((cue: AudioMix.Cue): boolean => cue.contactId === "jab:contact").length, 0);
  assert.throws((): void => { AudioMix.build(events, [contact, contact], [floor]); }, /Invalid audio contact receipt/u);
  assert.throws((): void => { AudioMix.build(events, [{ ...contact, actorId: "b", targetId: "a" }], [floor]); }, /Mismatched actual audio contact/u);
  assert.throws((): void => { AudioMix.build([], [contact]); }, /Unmapped actual audio contacts/u);
  assert.throws((): void => { AudioMix.build(events, [contact], []); }, /Missing actual mat contact/u);
  assert.throws((): void => { AudioMix.build([{ id: "bad-count", seconds: 167, kind: "count", actorId: "referee", count: 11 }], []); }, /Invalid referee count/u);
  assert.equal(JSON.stringify({ events, contact, floor }), before);
}

/**
 * The shared mixer obeys measured source offsets, rates, pan, cutoff and clipping.
 *
 * Scenarios:
 * 1. An independent ramp reaches the expected offset/rate sample in the left channel.
 * 2. Output is exactly three minutes with silent boundaries and faded excerpt edges.
 * 3. Coincident full-scale cues and source overruns refuse; inputs remain unchanged.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the actual PCM renderer on an independently constructed ramp. It checks a calculable interior sample, hard-left pan, silent regions, exact three-minute length, fades, input preservation and clipping refusal. It exercises arithmetic only, not browser autoplay, device output or listening.
 * @evidence contracts/testing.md#independent-cases A 48 kHz ramp with source[i]=i/9600 makes output sample 480 of the cue read source 1440 after a 480-sample offset at rate two. The fixed 0.5 master then gives 0.075 in the left channel. Three coincident full-scale hard-left cues at gain one exceed the permitted normalized peak.
 */
export function test_movie_audio_pcm_sample_semantics(): void {
  const source: Float32Array = Float32Array.from({ length: 4800 }, (_: unknown, index: number): number => index / 9600);
  const cue: AudioMix.Cue = { id: "ramp", seconds: 1, source: "air", offsetSeconds: 0.01, durationSeconds: 0.02, gain: 1, pan: -1, rate: 2 };
  const before: Float32Array = source.slice();
  const output: ReturnType<typeof AudioMix.render> = AudioMix.render([cue], new Map<AudioMix.Source, Float32Array>([["air", source]]));
  assert.equal(output.left.length, 8640000);
  assert.equal(output.right.length, 8640000);
  assert.ok(Math.abs(output.left[48000 + 480] - 0.075) < 1e-7);
  assert.equal(output.right[48000 + 480], 0);
  assert.equal(output.left[47999], 0);
  assert.equal(output.left[48000], 0);
  assert.equal(output.left[48000 + 959], 0);
  assert.equal(output.left[8639999], 0);
  assert.deepEqual(source, before);
  const full: Float32Array = new Float32Array(2000).fill(1);
  const loud: AudioMix.Cue[] = Array.from({ length: 3 }, (_: unknown, index: number): AudioMix.Cue => ({ ...cue, id: `loud-${index}`, offsetSeconds: 0, rate: 1 }));
  assert.throws((): void => { AudioMix.render(loud, new Map<AudioMix.Source, Float32Array>([["air", full]])); }, /Soundtrack clips/u);
  assert.throws((): void => { AudioMix.render([{ ...cue, offsetSeconds: 10 }], new Map<AudioMix.Source, Float32Array>([["air", full]])); }, /exceeds fixed bytes/u);
}

/**
 * PCM interchange preserves sample signs, stereo frame count and refusal bounds.
 *
 * Scenarios:
 * 1. Stereo PCM16 output has independently checked RIFF fields and signed sample codes.
 * 2. A handcrafted mono fixture decodes exact binary-fraction amplitudes.
 * 3. Unsupported stereo source, truncated RIFF and clipping output refuse.
 *
 * @evidence contracts/testing.md#observable-behavior Encodes known stereo amplitudes and reads the actual RIFF fields and interleaved PCM codes independently through DataView. It also feeds a handcrafted mono fixture into the real public-Ingest-backed decoder, and checks unsupported layout, truncation and clipping refusals. No native codec is mocked.
 * @evidence contracts/testing.md#independent-cases RIFF/WAVE defines a 44-byte minimal PCM header, 48 kHz stereo16 block alignment four, and signed negative full scale -32768. The handcrafted source uses those independent format constants; stereo encoding is intentionally refused by this production's mono-source admission.
 */
export function test_movie_audio_pcm_interchange(): void {
  const bytes: Uint8Array = AudioPcm.encode(new Float32Array([-1, 0, 1]), new Float32Array([0.5, -0.5, 0]));
  const view: DataView = new DataView(bytes.buffer);
  assert.equal(bytes.length, 56);
  assert.equal(view.getUint32(24, true), 48000);
  assert.equal(view.getUint16(22, true), 2);
  assert.equal(view.getUint32(40, true), 12);
  assert.equal(view.getInt16(44, true), -32768);
  assert.equal(view.getInt16(46, true), 16384);
  assert.equal(view.getInt16(52, true), 32767);
  assert.equal(view.getInt16(54, true), 0);
  assert.throws((): void => { AudioPcm.decode(bytes); }, /mono/u);
  assert.throws((): void => { AudioPcm.encode(new Float32Array([1.01]), new Float32Array([0])); }, /clipping/u);
  assert.throws((): void => { AudioPcm.encode(new Float32Array([0]), new Float32Array([0, 0])); }, /length/u);
  assert.throws((): void => { AudioPcm.encode(new Float32Array([Number.NaN]), new Float32Array([0])); }, /clipping/u);
  assert.throws((): void => { AudioPcm.decode(bytes.slice(0, 20)); });

  const mono: Uint8Array = new Uint8Array(52);
  const header: DataView = new DataView(mono.buffer);
  for (const [offset, text] of [[0, "RIFF"], [8, "WAVE"], [12, "fmt "], [36, "data"]] as const) for (let index: number = 0; index < text.length; index++) mono[offset + index] = text.charCodeAt(index);
  header.setUint32(4, 44, true); header.setUint32(16, 16, true); header.setUint16(20, 1, true); header.setUint16(22, 1, true); header.setUint32(24, 48000, true); header.setUint32(28, 96000, true); header.setUint16(32, 2, true); header.setUint16(34, 16, true); header.setUint32(40, 8, true);
  [-32768, -16384, 0, 32767].forEach((sample: number, index: number): void => { header.setInt16(44 + index * 2, sample, true); });
  assert.deepEqual([...AudioPcm.decode(mono)], [-1, -0.5, 0, 32767 / 32768]);
}

/**
 * The retained soundtrack catalogue reaches the exact hashed files used by export.
 *
 * Scenarios:
 * 1. Every required count, command and effect resolves to retained playback bytes.
 * 2. The real shared hash/decode consumer admits finite, nonempty 48 kHz mono samples.
 * 3. A changed byte refuses before decoding instead of silently replacing a source.
 *
 * @evidence contracts/testing.md#observable-behavior Reads the actual adopted files through the same URL and hash/decode owner used by Node export. It checks all four commands, ten count words and twelve effects, then corrupts a detached file copy and requires digest refusal. This byte-consumer unit launches no server, browser, synthesizer, converter or media encoder and cannot approve listening.
 * @evidence contracts/testing.md#independent-cases The commissioned male ten-count, explicit commands and sound categories determine the required identities independently of the manifest's inventory. SHA-256 is the retained asset identity; finite samples and a positive sample count are decoder obligations. A one-bit copy corruption is an independent negative case.
 */
export async function test_movie_audio_adopted_bytes(): Promise<void> {
  const sources: AudioMix.Source[] = ["punch1", "punch2", "punch3", "punch4", "punch5", "fight", "bell", "breath", "step", "air", "fall", "crowd", "applause", "down", "neutral", "decision", "count1", "count2", "count3", "count4", "count5", "count6", "count7", "count8", "count9", "count10"];
  const cues: AudioMix.Cue[] = sources.map((source: AudioMix.Source): AudioMix.Cue => ({ id: source, source, seconds: 0, offsetSeconds: 0, durationSeconds: 0.01, gain: 1, pan: 0, rate: 1 }));
  const assets: MovieAudioAssets.Asset[] = MovieAudioAssets.select(cues);
  assert.equal(assets.length, 26);
  for (const asset of assets) {
    const bytes: Buffer = await readFile(new URL(asset.url));
    const samples: Float32Array = await MovieAudioAssets.decode(asset, bytes);
    assert.ok(samples.length > 0);
    assert.ok(samples.every((sample: number): boolean => Number.isFinite(sample) && Math.abs(sample) <= 1));
  }
  const bytes: Buffer = await readFile(new URL(assets[0].url));
  const changed: Uint8Array = Uint8Array.from(bytes);
  changed[changed.length - 1] ^= 1;
  await assert.rejects(MovieAudioAssets.decode(assets[0], changed), /SHA-256 mismatch/u);
}
