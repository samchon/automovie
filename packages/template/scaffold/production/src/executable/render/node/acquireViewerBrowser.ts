/**
 * Close a browser which finishes opening after cancellation, before handing it to the recording owner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Close a browser which finishes opening after cancellation, before handing it to the recording owner) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Close a browser which finishes opening after cancellation, before handing it to the recording owner) directly over its typed inputs (`launch`, `signal`) as a fixed number of statements with no loop or recursion in the body, delegating to `signal?.throwIfAborted`, `launch`, `browser.close`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One async operation of 11 lines and 3 top-level statements that reuses `signal?.throwIfAborted`, `launch`, `browser.close` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `launch`, `signal`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Awaits 2 calls per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body awaits asynchronous work; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
 */
export async function acquireViewerBrowser<
  T extends { close: () => Promise<void> },
>(launch: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  signal?.throwIfAborted();
  const browser: T = await launch();
  try {
    signal?.throwIfAborted();
    return browser;
  } catch (error: unknown) {
    await browser.close();
    throw error;
  }
}
