import type { IAutoMovieCaptureVideoSource } from "@automovie/interface";

/* Read source ticks from the showinfo filter after the selection, in PNG order. */
export function readVideoPresentation(
  log: string,
  streamIndex: number,
  fileSha256: string,
  selected: readonly number[],
): IAutoMovieCaptureVideoSource.Presentation {
  const maps: number[] = [
    ...log.matchAll(/^\s+Stream #0:(\d+) -> #0:0\b/gmu),
  ].map((mapping: RegExpMatchArray): number => Number(mapping[1]));
  if (maps.length !== 1 || maps[0] !== streamIndex)
    return {
      type: "unavailable",
      reason: "The decoder did not confirm the selected video stream.",
    };

  let timeBase: readonly [number, number] | undefined;
  const frames: IAutoMovieCaptureVideoSource.IFrame[] = [];
  for (const line of log.split(/\r?\n/u)) {
    const output: string | undefined =
      /^\[Parsed_showinfo_\d+ @ [^\]]+\]\s+(.*)$/u.exec(line)?.[1];
    if (output === undefined) continue;
    const clock: RegExpExecArray | null =
      /^config in time_base:\s*(\d+)\/(\d+),/u.exec(output);
    if (clock !== null) {
      const numerator: number = Number(clock[1]);
      const denominator: number = Number(clock[2]);
      if (
        timeBase !== undefined ||
        ![numerator, denominator].every(Number.isSafeInteger) ||
        numerator <= 0 ||
        denominator <= 0
      )
        return {
          type: "unavailable",
          reason:
            "The selected frames do not share one exact decoder time base.",
        };
      timeBase = [numerator, denominator];
    }
    if (!output.startsWith("n:")) continue;
    const row: RegExpExecArray | null =
      /^n:\s*(\d+)\s+pts:\s*(-?\d+)\s+pts_time:/u.exec(output);
    const frame: number | undefined = selected[frames.length];
    const ticks: number = Number(row?.[2]);
    if (
      Number(row?.[1]) !== frames.length ||
      frame === undefined ||
      !Number.isSafeInteger(ticks)
    )
      return {
        type: "unavailable",
        reason: "A selected frame has missing or invalid presentation ticks.",
      };
    frames.push({ frame, ticks });
  }
  if (
    timeBase === undefined ||
    frames.length !== selected.length ||
    frames.length === 0
  )
    return {
      type: "unavailable",
      reason: "The decoded frame clock does not cover the complete selection.",
    };
  return { type: "decoded", fileSha256, streamIndex, timeBase, frames };
}
