/* The ordinal fallback and an explicit absolute index address the same FFmpeg input. */
export function videoStreamMap(streamIndex: number | undefined): string {
  if (streamIndex === undefined) return "0:v:0";
  if (!Number.isSafeInteger(streamIndex) || streamIndex < 0)
    throw new Error(
      `A capture video stream index must be a nonnegative safe integer`,
    );
  return `0:${streamIndex}`;
}
