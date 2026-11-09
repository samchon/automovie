/**
 * Admit a decoder's framemd5 listing against a commissioned half-open frame
 * clock: exactly one stream-zero time base, exactly `expectedFrames` video
 * rows, and frame `i` presenting precisely `[i / fps, (i + 1) / fps)` in that
 * time base, checked by exact BigInt cross products. Adjacent identical
 * images are reported as holds, never rejected. Malformed rows, gaps,
 * overlaps, reordering, excess frames and a nonzero start are refused. This
 * proves presentation continuity of decoded bytes, not motion or quality.
 *
 * @param text Complete FFmpeg framemd5 output.
 * @param expectedFrames Commissioned frame count, a positive safe integer.
 * @param fps Commissioned frames per second, a positive safe integer.
 * @returns The admitted frames and holds.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Admit a decoder's framemd5 listing against a commissioned half-open frame clock: exactly one stream-zero time base, exactly `expectedFrames` video rows, and frame `i` presenting precisely `[i / fps, (i + 1) / fps)` in that time base, checked by exact BigInt cross products) and documents parameters `text`, `expectedFrames`, `fps`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Admit a decoder's framemd5 listing against a commissioned half-open frame clock: exactly one stream-zero time base, exactly `expectedFrames` video rows, and frame `i` presenting precisely `[i / fps, (i + 1) / fps)` in that time base, checked by exact BigInt cross products) directly over its typed inputs (`text`, `expectedFrames`, `fps`) as nested iteration of depth 2 (for-of over text.split(/\r?\n/u); every over [numerator, denominator]; map over trimmed .split(",")), delegating to `Number.isSafeInteger`, `text.split`, `line.trim`, `trimmed.startsWith`, `Number`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (8 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 6, 5, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 90 lines and 9 top-level statements that reuses `Number.isSafeInteger`, `text.split`, `line.trim`, `trimmed.startsWith`, `Number` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 10 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `text`, `expectedFrames`, `fps`; the dominant cost is nested iteration of depth 2 (for-of over text.split(/\r?\n/u); every over [numerator, denominator]; map over trimmed .split(",")), performed once per call with 15 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 15 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function auditAutoMovieDecodedFrames(
  text: string,
  expectedFrames: number,
  fps: number,
): auditAutoMovieDecodedFrames.IResult {
  if (
    !Number.isSafeInteger(expectedFrames) ||
    expectedFrames < 1 ||
    !Number.isSafeInteger(fps) ||
    fps < 1
  )
    throw new Error(
      "A decoded audit requires a positive integral frame count and rate",
    );
  const frames: auditAutoMovieDecodedFrames.IFrame[] = [];
  const repeatedImages: number[] = [];
  let timeBase: readonly [number, number] | undefined;
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
        const numerator: number = Number(match[1]);
        const denominator: number = Number(match[2]);
        if (
          ![numerator, denominator].every(
            (v: number): boolean => Number.isSafeInteger(v) && v > 0,
          )
        )
          throw new Error("Invalid decoded time base");
        timeBase = [numerator, denominator];
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
    const [stream, dts, pts, duration, bytes]: number[] = fields
      .slice(0, 5)
      .map(Number);
    if (
      ![stream, dts, pts, duration, bytes].every(
        (v: number | undefined): boolean =>
          v !== undefined && Number.isSafeInteger(v),
      ) ||
      stream !== 0 ||
      dts !== pts ||
      pts! < 0 ||
      duration! <= 0 ||
      bytes! <= 0
    )
      throw new Error("Invalid decoded video timing or raster extent");
    if (frames.length >= expectedFrames)
      throw new Error("Decoded video contains excess frames");
    const md5: string = fields[5]!.toLowerCase();
    if (frames.at(-1)?.md5 === md5) repeatedImages.push(frames.length);
    frames.push({ stream: stream!, pts: pts!, duration: duration!, md5 });
  }
  if (timeBase === undefined || frames.length !== expectedFrames)
    throw new Error(
      "Decoded video is missing its time base or commissioned frames",
    );
  const scale: bigint = BigInt(timeBase[0]) * BigInt(fps);
  frames.forEach(
    (frame: auditAutoMovieDecodedFrames.IFrame, index: number): void => {
      if (
        BigInt(frame.pts) * scale !== BigInt(index) * BigInt(timeBase![1]) ||
        (BigInt(frame.pts) + BigInt(frame.duration)) * scale !==
          BigInt(index + 1) * BigInt(timeBase![1])
      )
        throw new Error(
          `Decoded frame ${index} does not cover its exact presentation interval`,
        );
    },
  );
  return {
    frameCount: frames.length,
    durationSeconds: expectedFrames / fps,
    timeBase,
    frames,
    repeatedImages,
  };
}
/**
 * Companion types of {@link auditAutoMovieDecodedFrames}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Companion types of ) and documents 2 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Companion types of : companion namespace of 2 members (`IFrame`, `IResult`); units and frames named in its text: frame, bytes, seconds, frames. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `auditAutoMovieDecodedFrames` in packages/render/src/delivery/auditAutoMovieDecodedFrames.ts; its surface is the 2 members listed and the text shows 3 other files naming it, mostly packages/render (2), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace auditAutoMovieDecodedFrames {
  /** One decoded frame. */
  export interface IFrame {
    /** Decoder stream index. */
    stream: number;

    /** Presentation timestamp, time-base ticks. */
    pts: number;

    /** Presentation duration, time-base ticks. */
    duration: number;

    /** Lowercase MD5 of the decoded image bytes. */
    md5: string;
  }

  /** An admitted decoded stream. */
  export interface IResult {
    /** Decoded images. */
    frameCount: number;

    /** Commissioned duration, seconds. */
    durationSeconds: number;

    /** Decoder time base. */
    timeBase: readonly [number, number];

    /** Every frame in output order. */
    frames: IFrame[];

    /** Indices of frames identical to their predecessor. */
    repeatedImages: number[];
  }
}
