/**
 * The capture URL of a local review page: the requested URL with its path
 * and unrelated options kept, the given capture parameters set, and
 * autoplay (`play`) removed because capture seeks each frame. Only an HTTP
 * loopback host is admitted, so capture never drives a remote page.
 *
 * @param requested The review page URL.
 * @param parameters Capture parameters to set, such as raster and range.
 * @returns The capture URL.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (The capture URL of a local review page: the requested URL with its path and unrelated options kept, the given capture parameters set, and autoplay (`play`) removed because capture seeks each frame) and documents parameters `requested`, `parameters`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (The capture URL of a local review page: the requested URL with its path and unrelated options kept, the given capture parameters set, and autoplay (`play`) removed because capture seeks each frame) directly over its typed inputs (`requested`, `parameters`) as a single pass (for-of over Object.entries(parameters)), delegating to `Object.entries`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 12 lines and 5 top-level statements that reuses `Object.entries` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `requested`, `parameters`; the dominant cost is a single pass (for-of over Object.entries(parameters)), performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
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
