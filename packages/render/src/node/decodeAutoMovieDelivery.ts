import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { auditAutoMovieDecodedFrames } from "../delivery/auditAutoMovieDecodedFrames";
import { auditAutoMovieEncodedPresentation } from "../delivery/auditAutoMovieEncodedPresentation";

/**
 * Decode every image and audio sample of a delivered MP4 and audit its clock.
 *
 * One FFmpeg run keeps input timestamps (`-copyts`), passes every video image
 * through at the demuxer time base into a framemd5 listing beside the file,
 * and streams the audio as stereo float at the given rate into a peak and
 * RMS counter; no decoded PCM is retained. The listing is admitted by
 * {@link auditAutoMovieDecodedFrames}, an FFprobe run by
 * {@link auditAutoMovieEncodedPresentation}, and the decoded audio must
 * cover the presentation, within one AAC frame (1024 samples) of end
 * padding, and must not be silent. Every child must exit 0; a twenty-minute
 * deadline or the abort signal ends it. The result is also written to
 * `<output>.decode.json`.
 *
 * @returns The video audit, audio statistics, probe and timings.
 */
export async function decodeAutoMovieDelivery(options: {
  /** Delivered MP4. */ outputPath: string;
  /** FFmpeg executable. */ ffmpegExecutable: string;
  /** FFprobe executable. */ ffprobeExecutable: string;
  /** Commissioned frame count. */ frameCount: number;
  /** Commissioned frames per second. */ fps: number;
  /** Raster width, pixels. */ width: number;
  /** Raster height, pixels. */ height: number;
  /** Audio samples per second; 48000 by default. */ sampleRate?: number;
  /** Cancellation. */ signal?: AbortSignal;
}): Promise<decodeAutoMovieDelivery.IResult> {
  const sampleRate: number = options.sampleRate ?? 48000;
  const begun: number = performance.now();
  const checksumPath: string = path.resolve(`${options.outputPath}.framemd5`);
  let audioBytes: number = 0;
  let squaredSum: number = 0;
  let peak: number = 0;
  let carry: Buffer = Buffer.alloc(0);
  await run(
    options.ffmpegExecutable,
    [
      "-v",
      "error",
      "-nostdin",
      "-y",
      "-copyts",
      "-threads",
      "4",
      "-i",
      options.outputPath,
      "-map",
      "0:v:0",
      "-an",
      "-fps_mode",
      "passthrough",
      "-enc_time_base",
      "demux",
      "-f",
      "framemd5",
      checksumPath,
      "-map",
      "0:a:0",
      "-vn",
      "-ar",
      String(sampleRate),
      "-ac",
      "2",
      "-f",
      "f32le",
      "pipe:1",
    ],
    (chunk: Buffer): void => {
      const bytes: Buffer =
        carry.length === 0 ? chunk : Buffer.concat([carry, chunk]);
      const complete: number = bytes.length - (bytes.length % 4);
      for (let offset: number = 0; offset < complete; offset += 4) {
        const value: number = bytes.readFloatLE(offset);
        if (!Number.isFinite(value))
          throw new Error("The decoded soundtrack contains nonfinite samples");
        peak = Math.max(peak, Math.abs(value));
        squaredSum += value * value;
      }
      audioBytes += complete;
      carry = Buffer.from(bytes.subarray(complete));
    },
    options.signal,
  );
  if (carry.length !== 0 || audioBytes % 8 !== 0 || audioBytes === 0)
    throw new Error(
      "The decoded soundtrack does not contain complete stereo samples",
    );
  const decodeMs: number = performance.now() - begun;
  const video: auditAutoMovieDecodedFrames.IResult =
    auditAutoMovieDecodedFrames(
      await readFile(checksumPath, "utf8"),
      options.frameCount,
      options.fps,
    );
  const probeStarted: number = performance.now();
  const chunks: Buffer[] = [];
  let retained: number = 0;
  await run(
    options.ffprobeExecutable,
    [
      "-v",
      "error",
      "-show_streams",
      "-show_format",
      "-of",
      "json",
      options.outputPath,
    ],
    (chunk: Buffer): void => {
      retained += chunk.length;
      if (retained > 1024 * 1024)
        throw new Error("The stream probe exceeded its metadata budget");
      chunks.push(chunk);
    },
    options.signal,
  );
  const streams: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  auditAutoMovieEncodedPresentation(streams, {
    durationSeconds: options.frameCount / options.fps,
    width: options.width,
    height: options.height,
    fps: options.fps,
    sampleRate,
    channels: 2,
  });
  const probeMs: number = performance.now() - probeStarted;
  const samples: number = audioBytes / 8;
  const presentation: number = (options.frameCount / options.fps) * sampleRate;
  if (samples < presentation || samples > presentation + 1024 || peak === 0)
    throw new Error(
      "The decoded soundtrack is silent, truncated or longer than one AAC frame of padding",
    );
  const result: decodeAutoMovieDelivery.IResult = {
    video,
    audio: {
      decodedSamplesPerChannel: samples,
      sampleRate,
      channels: 2,
      peak,
      rms: Math.sqrt(squaredSum / (audioBytes / 4)),
    },
    streams,
    decodeMs,
    probeMs,
  };
  await writeFile(
    `${options.outputPath}.decode.json`,
    JSON.stringify(result, null, 2),
  );
  return result;
}
/** Companion types of {@link decodeAutoMovieDelivery}. */
export namespace decodeAutoMovieDelivery {
  /** A decoded delivery's audit. */
  export interface IResult {
    /** The admitted decoded video. */
    video: auditAutoMovieDecodedFrames.IResult;

    /** Decoded audio statistics. */
    audio: {
      /** Samples per channel, including AAC end padding. */ decodedSamplesPerChannel: number;
      /** Samples per second. */ sampleRate: number;
      /** Channels. */ channels: number;
      /** Peak absolute amplitude. */ peak: number;
      /** Root mean square amplitude. */ rms: number;
    };

    /** The FFprobe output. */
    streams: unknown;

    /** Decode wall milliseconds. */
    decodeMs: number;

    /** Probe wall milliseconds. */
    probeMs: number;
  }
}

/** Run one owned child without a shell, bounding stderr and terminating it on a consumer error, abort or the deadline. */
function run(
  executable: string,
  args: string[],
  consume: (chunk: Buffer) => void,
  signal?: AbortSignal,
): Promise<undefined> {
  signal?.throwIfAborted();
  return new Promise<undefined>(
    (
      resolve: (value: undefined) => void,
      reject: (error: Error) => void,
    ): void => {
      const child: ChildProcessWithoutNullStreams = spawn(executable, args, {
        windowsHide: true,
        stdio: "pipe",
        ...(signal ? { signal } : {}),
      });
      let stderr: string = "";
      let failure: Error | undefined;
      child.stdin.end();
      const timer: ReturnType<typeof setTimeout> = setTimeout(
        (): void => {
          failure = new Error("Media verification exceeded twenty minutes");
          child.kill();
        },
        20 * 60 * 1000,
      );
      child.stdout.on("data", (chunk: Buffer): void => {
        if (failure !== undefined) return;
        try {
          consume(chunk);
        } catch (error: unknown) {
          failure = error instanceof Error ? error : new Error(String(error));
          child.kill();
        }
      });
      child.stderr.on("data", (chunk: Buffer): void => {
        stderr = (stderr + chunk.toString("utf8")).slice(-65536);
      });
      child.once("error", (error: Error): void => {
        failure = error;
      });
      child.once("close", (code: number | null): void => {
        clearTimeout(timer);
        if (failure !== undefined) reject(failure);
        else if (code !== 0)
          reject(new Error(`Media verification exited ${code}: ${stderr}`));
        else resolve(undefined);
      });
    },
  );
}
