import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { FilmDecodeAudit } from "./FilmDecodeAudit";

/**
 * Decode every encoded video image and audio sample, retaining exact clock receipts.
 *
 * @evidence contracts/common.md#implementation-and-ownership Runs FFmpeg once without lossy encoding, preserving input timestamps, passing every video image through at the demuxer time base and writing framemd5 beside the delivery. The 48 kHz stereo float audio stream feeds a bounded RMS/peak counter. FFprobe separately reports actual stream presentation extent. Every child must exit successfully; timeout or cancellation terminates its owned process. No decoded PCM is retained.
 * @evidence contracts/common.md#authoring-interface Supply the delivered MP4, FFmpeg 6.1-compatible and FFprobe executable paths and independently commissioned count/rate. Returned decoded video continuity is exact rational arithmetic; audio sample count can include AAC end padding and is reported separately from MP4 presentation duration. Listening and body-motion review remain external acceptance duties.
 */
export async function decodeFilm(options: {
  outputPath: string;
  ffmpegExecutable: string;
  ffprobeExecutable: string;
  frameCount: number;
  fps: number;
  width: number;
  height: number;
  signal?: AbortSignal;
}): Promise<{
  video: FilmDecodeAudit.Result;
  audio: { decodedSamplesPerChannel: number; sampleRate: number; channels: number; peak: number; rms: number };
  streams: unknown;
  decodeMs: number;
  probeMs: number;
}> {
  const begun: number = performance.now();
  const checksumPath: string = path.resolve(`${options.outputPath}.framemd5`);
  let audioBytes: number = 0;
  let squaredSum: number = 0;
  let peak: number = 0;
  let carry: Buffer = Buffer.alloc(0);

  // Preserve original PTS and its precision instead of repairing a bad stream by frame synchronization.
  // https://github.com/FFmpeg/FFmpeg/blob/n6.1.1/doc/ffmpeg.texi documents copyts, fps_mode and enc_time_base.
  await run(options.ffmpegExecutable, ["-v", "error", "-nostdin", "-y", "-copyts", "-threads", "4", "-i", options.outputPath, "-map", "0:v:0", "-an", "-fps_mode", "passthrough", "-enc_time_base", "demux", "-f", "framemd5", checksumPath, "-map", "0:a:0", "-vn", "-ar", "48000", "-ac", "2", "-f", "f32le", "pipe:1"], (chunk: Buffer): void => {
    const bytes: Buffer = carry.length === 0 ? chunk : Buffer.concat([carry, chunk]);
    const complete: number = bytes.length - bytes.length % 4;
    for (let offset: number = 0; offset < complete; offset += 4) {
      const value: number = bytes.readFloatLE(offset);
      if (!Number.isFinite(value)) throw new Error("Decoded soundtrack contains nonfinite samples");
      peak = Math.max(peak, Math.abs(value));
      squaredSum += value * value;
    }
    audioBytes += complete;
    carry = Buffer.from(bytes.subarray(complete));
  }, options.signal);
  if (carry.length !== 0 || audioBytes % 8 !== 0 || audioBytes === 0)
    throw new Error("Decoded soundtrack does not contain complete stereo samples");
  const decodeMs: number = performance.now() - begun;
  const video: FilmDecodeAudit.Result = FilmDecodeAudit.inspect(await readFile(checksumPath, "utf8"), options.frameCount, options.fps);

  const probeStarted: number = performance.now();
  const chunks: Buffer[] = [];
  let retained: number = 0;
  await run(options.ffprobeExecutable, ["-v", "error", "-show_streams", "-show_format", "-of", "json", options.outputPath], (chunk: Buffer): void => {
    retained += chunk.length;
    if (retained > 1024 * 1024) throw new Error("Encoded stream probe exceeded its metadata budget");
    chunks.push(chunk);
  }, options.signal);
  const streams: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  FilmDecodeAudit.presentation(streams, { durationSeconds: options.frameCount / options.fps, width: options.width, height: options.height, fps: options.fps });
  const probeMs: number = performance.now() - probeStarted;
  const audio: { decodedSamplesPerChannel: number; sampleRate: number; channels: number; peak: number; rms: number } = {
    decodedSamplesPerChannel: audioBytes / 8, sampleRate: 48000, channels: 2, peak, rms: Math.sqrt(squaredSum / (audioBytes / 4)),
  };
  const presentationSamples: number = options.frameCount / options.fps * 48000;
  if (audio.decodedSamplesPerChannel < presentationSamples || audio.decodedSamplesPerChannel > presentationSamples + 1024 || audio.peak === 0)
    throw new Error("Decoded soundtrack is silent, truncated or exceeds one AAC frame of end padding");
  const result: { video: FilmDecodeAudit.Result; audio: typeof audio; streams: unknown; decodeMs: number; probeMs: number } = { video, audio, streams, decodeMs, probeMs };
  await writeFile(`${options.outputPath}.decode.json`, JSON.stringify(result, null, 2));
  return result;
}

/**
 * Run one owned decoder/probe, bounding diagnostics and terminating failed consumers.
 *
 * spawn receives a literal argument vector without a shell. One child and timer
 * are released on exit; stderr retains its last 64 KiB. Callback errors terminate
 * the child and preserve the cause. Synchronous byte consumers must finish
 * before successful exit; a twenty-minute deadline bounds a stalled decoder.
 */
function run(executable: string, args: string[], consume: (chunk: Buffer) => void, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted();
  return new Promise<void>((resolve: () => void, reject: (error: unknown) => void): void => {
    const child: ChildProcessWithoutNullStreams = spawn(executable, args, { windowsHide: true, stdio: "pipe", signal });
    let stderr: string = "";
    let failure: unknown;
    child.stdin.end();
    const timer: ReturnType<typeof setTimeout> = setTimeout((): void => { failure = new Error("Media verification exceeded twenty minutes"); child.kill(); }, 20 * 60 * 1000);
    child.stdout.on("data", (chunk: Buffer): void => {
      if (failure !== undefined) return;
      try { consume(chunk); } catch (error: unknown) { failure = error; child.kill(); }
    });
    child.stderr.on("data", (chunk: Buffer): void => { stderr = (stderr + chunk.toString("utf8")).slice(-65536); });
    child.once("error", (error: Error): void => { failure = error; });
    child.once("close", (code: number | null): void => {
      clearTimeout(timer);
      if (failure !== undefined) reject(failure);
      else if (code !== 0) reject(new Error(`Media verification exited ${code}: ${stderr}`));
      else resolve();
    });
  });
}
