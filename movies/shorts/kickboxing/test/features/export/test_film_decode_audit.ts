import assert from "node:assert/strict";
import { FilmDecodeAudit } from "../../../src/export/FilmDecodeAudit";

/**
 * Distinguish exact continuous decoded presentation from merely having a file.
 *
 * Scenarios:
 * 1. Three frames at 30 fps and a 1/30000 time base cover [0,.1] exactly.
 * 2. Identical adjacent decoded pixels are retained as legitimate holds.
 * 3. Gaps, missing/excess frames, malformed hashes, reordered timestamps and duplicate time bases refuse.
 * 4. Safe input ticks retain exact interval sums beyond Number's safe range.
 * 5. Independent video/audio presentation clocks must both span exactly 180 seconds with the commissioned tracks and profile.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the pure decoded-output parser with independently authored FFmpeg-format rows and checks its returned clock and refusals. No process, browser or media encoder runs; real complete decoding remains the export command's responsibility.
 * @evidence contracts/testing.md#independent-cases The 1000-tick intervals follow 30000/30 arithmetic; a 3002399751580331 denominator forces the third exact endpoint beyond safe Number addition. Separate 15360-Hz video and 48000-Hz audio clocks independently span 180 seconds. Empty, malformed, duplicate, missing, excess, reordered and fractional-plan inputs distinguish parsing branches; codec, raster, rate, track and duration mutations distinguish presentation admission, while repeated imagery remains valid.
 */
export function test_film_decode_audit(): void {
  const hash: string = "0123456789abcdef0123456789abcdef";
  const header: string = "#format: frame checksums\n#tb 0: 1/30000\n";
  const rows: string[] = [0, 1000, 2000].map((pts: number): string => `0, ${pts}, ${pts}, 1000, 2764800, ${hash}`);
  const valid: string = header + rows.join("\n");
  const result: FilmDecodeAudit.Result = FilmDecodeAudit.inspect(valid, 3, 30);
  assert.equal(result.frameCount, 3);
  assert.equal(result.durationSeconds, 0.1);
  assert.deepEqual(result.timeBase, [1, 30000]);
  assert.deepEqual(result.repeatedImages, [1, 2]);
  assert.equal(result.frames[2]!.pts, 2000);
  assert.throws((): FilmDecodeAudit.Result => FilmDecodeAudit.inspect("", 3, 30));
  assert.throws((): FilmDecodeAudit.Result => FilmDecodeAudit.inspect(header + rows.slice(0, 2).join("\n"), 3, 30));
  assert.throws((): FilmDecodeAudit.Result => FilmDecodeAudit.inspect(valid + "\n" + rows[2], 3, 30));
  assert.throws((): FilmDecodeAudit.Result => FilmDecodeAudit.inspect(valid.replace("0, 1000, 1000", "0, 1001, 1001"), 3, 30));
  assert.throws((): FilmDecodeAudit.Result => FilmDecodeAudit.inspect(header + [...rows].reverse().join("\n"), 3, 30));
  assert.throws((): FilmDecodeAudit.Result => FilmDecodeAudit.inspect(valid.replace(hash, "bad"), 3, 30));
  assert.throws((): FilmDecodeAudit.Result => FilmDecodeAudit.inspect(header + valid, 3, 30));
  assert.throws((): FilmDecodeAudit.Result => FilmDecodeAudit.inspect(valid, 3.1, 30));
  assert.throws((): FilmDecodeAudit.Result => FilmDecodeAudit.inspect(valid, 3, Number.NaN));

  // The final end tick exceeds Number's safe range although every parsed field is safe.
  const wideTick: string = "#tb 0: 1/3002399751580331\n" + ["0", "3002399751580331", "6004799503160662"].map((pts: string): string => `0, ${pts}, ${pts}, 3002399751580331, 1, ${hash}`).join("\n");
  assert.equal(FilmDecodeAudit.inspect(wideTick, 3, 1).durationSeconds, 3);

  // These independent stream clocks both span precisely 180 seconds.
  const video: Record<string, unknown> = { codec_type: "video", codec_name: "h264", width: 1280, height: 720, avg_frame_rate: "30/1", start_time: "0.000000", duration_ts: 2764800, time_base: "1/15360" };
  const audio: Record<string, unknown> = { codec_type: "audio", codec_name: "aac", sample_rate: "48000", channels: 2, start_time: "0.000000", duration_ts: 8640000, time_base: "1/48000" };
  const profile: { durationSeconds: number; width: number; height: number; fps: number } = { durationSeconds: 180, width: 1280, height: 720, fps: 30 };
  FilmDecodeAudit.presentation({ streams: [video, audio] }, profile);
  for (const replacement of [{ ...video, duration_ts: 2764799 }, { ...video, start_time: "0.033333" }, { ...video, width: 1920 }, { ...video, avg_frame_rate: "24/1" }])
    assert.throws((): void => FilmDecodeAudit.presentation({ streams: [replacement, audio] }, profile));
  for (const replacement of [{ ...audio, duration_ts: 8639999 }, { ...audio, channels: 1 }, { ...audio, codec_name: "mp3" }, { ...audio, time_base: "0/48000" }])
    assert.throws((): void => FilmDecodeAudit.presentation({ streams: [video, replacement] }, profile));
  assert.throws((): void => FilmDecodeAudit.presentation({ streams: [video] }, profile));
  assert.throws((): void => FilmDecodeAudit.presentation(null, profile));
}
