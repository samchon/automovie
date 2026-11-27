import { AutoMovieEngineFrameClock } from "@automovie/engine";
import type {
  IAutoMovieDecodedFrame,
  IAutoMovieDecodedFrameAudit,
  IAutoMovieDeliveryContentAudit,
} from "@automovie/interface";

/*
 * Admit a decoder's framemd5 listing against a commissioned half-open frame
 * clock: exactly one stream-zero time base, exactly `expectedFrames` video
 * rows, and frame `i` presenting precisely `[i / fps, (i + 1) / fps)` in that
 * time base, checked on the exact native tick grid. Adjacent identical images
 * are reported as holds, never rejected. Malformed rows, gaps, overlaps,
 * reordering, excess frames and a nonzero start are refused. This proves
 * presentation continuity of decoded bytes, not motion or quality.
 * Parameter text: Complete FFmpeg framemd5 output.
 * Parameter expectedFrames: Commissioned frame count, a positive safe integer.
 * Parameter fps: Commissioned frames per second, a positive safe integer.
 * Returns: The admitted frames and holds.
 */
export function auditDecodedFrames(
  text: string,
  expectedFrames: number,
  fps: number,
): IAutoMovieDecodedFrameAudit {
  if (
    !Number.isSafeInteger(expectedFrames) ||
    expectedFrames < 1 ||
    !Number.isSafeInteger(fps) ||
    fps < 1
  )
    throw new Error(
      "A decoded audit requires a positive integral frame count and rate",
    );
  const frames: IAutoMovieDecodedFrame[] = [];
  const repeatedImages: number[] = [];
  let timeBase: IAutoMovieDeliveryContentAudit.Ratio | undefined;
  for (const line of text.split(/\r?\n/u)) {
    const trimmed: string = line.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.startsWith("#")) {
      const match: RegExpExecArray | null = /^#tb 0:\s*(\d+)\/(\d+)$/u.exec(
        trimmed,
      );
      if (match !== null) {
        if (timeBase !== undefined)
          throw new Error("Duplicate decoded time base");
        const ratio: IAutoMovieDeliveryContentAudit.Ratio = [
          Number(match[1]),
          Number(match[2]),
        ];
        if (!AutoMovieEngineFrameClock.isRatio(ratio))
          throw new Error("Invalid decoded time base");
        timeBase = ratio;
      }
      continue;
    }
    const fields: string[] = trimmed
      .split(",")
      .map((f: string): string => f.trim());
    if (
      fields.length !== 6 ||
      !fields.slice(0, 5).every((f: string): boolean => /^-?\d+$/u.test(f)) ||
      !/^[a-f\d]{32}$/iu.test(fields[5]!)
    )
      throw new Error("Malformed decoded video row");
    const stream: number = Number(fields[0]);
    const dts: number = Number(fields[1]);
    const pts: number = Number(fields[2]);
    const duration: number = Number(fields[3]);
    const bytes: number = Number(fields[4]);
    if (
      stream !== 0 ||
      dts !== pts ||
      !Number.isSafeInteger(pts) ||
      pts < 0 ||
      !Number.isSafeInteger(duration) ||
      duration <= 0 ||
      !Number.isSafeInteger(pts + duration) ||
      !Number.isSafeInteger(bytes) ||
      bytes <= 0
    )
      throw new Error("Invalid decoded video timing or raster extent");
    if (frames.length >= expectedFrames)
      throw new Error("Decoded video contains excess frames");
    const md5: string = fields[5]!.toLowerCase();
    if (frames.at(-1)?.md5 === md5) repeatedImages.push(frames.length);
    frames.push({ stream, pts, duration, md5 });
  }
  if (timeBase === undefined || frames.length !== expectedFrames)
    throw new Error(
      "Decoded video is missing its time base or commissioned frames",
    );
  const step: number | null = AutoMovieEngineFrameClock.ticksPerFrame(
    timeBase,
    [fps, 1],
  );
  frames.forEach((frame: IAutoMovieDecodedFrame, index: number): void => {
    if (
      step === null ||
      frame.pts !== AutoMovieEngineFrameClock.boundary(index, step) ||
      frame.duration !== step
    )
      throw new Error(
        `Decoded frame ${index} does not cover its exact presentation interval`,
      );
  });
  return {
    frameCount: frames.length,
    durationSeconds: expectedFrames / fps,
    timeBase,
    frames,
    repeatedImages,
  };
}
