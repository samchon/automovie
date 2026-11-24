import type { IAutoMovieCaptureVideoSource } from "@automovie/interface";

/**
 * Read the report of `planAutoMovieVideoSceneCuts` into the file's scene cuts:
 * the second each new scene starts and its `scdet` score, in the report's
 * order.
 *
 * The report is FFmpeg's `metadata` print: a `frame:<n> pts:<t>
 * pts_time:<seconds>` line per marked frame, followed by `key=value` lines
 * among which `lavfi.scd.score` and `lavfi.scd.time`. A frame's second is its
 * `lavfi.scd.time`, or its `pts_time` when that key is missing. Line endings
 * may be `\n` or `\r\n`, and other keys are ignored. An empty report means the
 * file has no cut at the threshold used.
 *
 * It throws naming the frame for a marked frame without a readable second or
 * score.
 */
export function readAutoMovieVideoSceneCuts(
  report: string,
): IAutoMovieCaptureVideoSource["cuts"] {
  const cuts: { seconds: number; score: number }[] = [];
  let frame: { header: string; values: Map<string, string> } | null = null;
  const close: () => void = (): void => {
    if (frame === null) return;
    const header: RegExpExecArray | null = /pts_time:(\S+)/u.exec(frame.header);
    const seconds: number = Number(
      frame.values.get("lavfi.scd.time") ?? header?.[1],
    );
    const score: number = Number(frame.values.get("lavfi.scd.score"));
    cuts.push({ seconds, score });
  };
  for (const line of report.split(/\r?\n/u)) {
    const text: string = line.trim();
    if (text.startsWith("frame:")) {
      close();
      frame = { header: text, values: new Map() };
      continue;
    }
    const equals: number = text.indexOf("=");
    if (frame !== null && equals > 0)
      frame.values.set(text.slice(0, equals), text.slice(equals + 1));
  }
  close();
  return cuts;
}
