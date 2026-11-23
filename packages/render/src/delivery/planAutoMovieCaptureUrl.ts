/**
 * The capture URL of a local review page: the requested URL with its path
 * and unrelated options kept, the given capture parameters set, and
 * autoplay (`play`) removed because capture seeks each frame. Only an HTTP
 * loopback host is admitted, so capture never drives a remote page.
 *
 * @param requested The review page URL.
 * @param parameters Capture parameters to set, such as raster and range.
 * @returns The capture URL.
 */
export function planAutoMovieCaptureUrl(
  requested: string,
  parameters: Readonly<Record<string, string>>,
): string {
  const result: URL = new URL(requested);
  if (
    result.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "[::1]"].includes(result.hostname)
  )
    throw new Error("Capture requires a local HTTP review page");
  for (const [key, value] of Object.entries(parameters))
    result.searchParams.set(key, value);
  result.searchParams.delete("play");
  return result.href;
}
