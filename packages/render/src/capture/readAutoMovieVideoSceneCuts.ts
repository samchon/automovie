/**
 * Read the report of `planAutoMovieVideoSceneCuts` into the file's scene cuts: the second each new scene starts and its `scdet` score, in the report's order.
 *
 * The report is FFmpeg's `metadata` print: a `frame:<n> pts:<t> pts_time:<seconds>` line per marked frame, followed by `key=value` lines among which `lavfi.scd.score` and `lavfi.scd.time`. A frame's second is its `lavfi.scd.time`, or its `pts_time` when that key is missing. Line endings may be `\n` or `\r\n`, and other keys are ignored. An empty report means the file has no cut at the threshold used.
 *
 * It throws naming the frame for a marked frame without a readable second or score.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the report's form, which values are read and their fallback, what is ignored, what an empty report means, and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The `metadata` filter prints one header line per frame and one `key=value` line per entry, and `scdet` sets `lavfi.scd.score` on every frame and `lavfi.scd.time` on a changed one, so grouping lines under their header gives one cut per marked frame.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the lines, closing a cut at each new header and at the end.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A frame missing its score throws instead of being dropped or given a score of zero.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the report's length.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one text.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh list and keeps nothing.
 */
export function readAutoMovieVideoSceneCuts(report: string): {
  /** Second of the first frame of the new scene, in the file's time. */
  seconds: number;

  /** `scdet` score of the change, 0 to 100. */
  score: number;
}[] {
  const cuts: { seconds: number; score: number }[] = [];
  let frame: { header: string; values: Map<string, string> } | null = null;
  const close: () => void = (): void => {
    if (frame === null) return;
    const header: RegExpExecArray | null = /pts_time:(\S+)/u.exec(frame.header);
    const seconds: number = Number(
      frame.values.get("lavfi.scd.time") ?? header?.[1],
    );
    const score: number = Number(frame.values.get("lavfi.scd.score"));
    if (!Number.isFinite(seconds) || !Number.isFinite(score))
      throw new Error(
        `The scene-cut report's frame "${frame.header}" has no readable time and score`,
      );
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
