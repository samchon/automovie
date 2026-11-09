/**
 * Refuse a capture page that is not ready or does not expose the commissioned
 * clock, before any sound is prepared or pixel captured: the page must be
 * ready, report the commissioned duration and frame rate, and count exactly
 * `durationSeconds * fps` frames, an integer. Readiness is no visual or
 * physical acceptance.
 *
 * @param host Values read from the capture page.
 * @param expected The commissioned duration and rate.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Refuse a capture page that is not ready or does not expose the commissioned clock, before any sound is prepared or pixel captured: the page must be ready, report the commissioned duration and frame rate, and count exactly `durationSeconds * fps` frames, an integer) and documents parameters `host`, `expected` as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Refuse a capture page that is not ready or does not expose the commissioned clock, before any sound is prepared or pixel captured: the page must be ready, report the commissioned duration and frame rate, and count exactly `durationSeconds * fps` frames, an integer) directly over its typed inputs (`host`, `expected`) as a fixed number of statements with no loop or recursion in the body, delegating to `Number.isSafeInteger`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 12 lines and 1 top-level statements that reuses `Number.isSafeInteger` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `host`, `expected`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
 */
export function assertAutoMovieCaptureClock(
  host: {
    ready: boolean;
    durationSeconds: number;
    fps: number;
    frameCount: number;
  },
  expected: { durationSeconds: number; fps: number },
): void {
  if (
    host.ready !== true ||
    host.durationSeconds !== expected.durationSeconds ||
    host.fps !== expected.fps ||
    host.frameCount !== host.durationSeconds * host.fps ||
    !Number.isSafeInteger(host.frameCount)
  )
    throw new Error(
      "The capture page does not expose the complete commissioned clock",
    );
}
