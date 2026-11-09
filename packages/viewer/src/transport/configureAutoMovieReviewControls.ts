/**
 * Publish a source's available range, the admitted review interval and speed,
 * and a status label to a review document before playback is enabled: the
 * `#seek`, `#start` and `#end` inputs take the range as their bounds, the
 * interval and speed fill `#start`, `#end` and `#speed`, and the label fills
 * `header p`. A missing control throws; it is a host failure, never a
 * fallback range.
 *
 * @param root The review document root.
 * @param review The available range, the interval from `readAutoMovieReviewInterval`, and the label.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Publish a source's available range, the admitted review interval and speed, and a status label to a review document before playback is enabled: the `#seek`, `#start` and `#end` inputs take the range as their bounds, the interval and speed fill `#start`, `#end` and `#speed`, and the label fills `header p`) and documents parameters `root`, `review` as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Publish a source's available range, the admitted review interval and speed, and a status label to a review document before playback is enabled: the `#seek`, `#start` and `#end` inputs take the range as their bounds, the interval and speed fill `#start`, `#end` and `#speed`, and the label fills `header p`) directly over its typed inputs (`root`, `review`) as a single pass (for-of over ["#seek", "#start", "#end"]), delegating to `root.querySelector`, `element`, `String`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 15 lines and 6 top-level statements that reuses `root.querySelector`, `element`, `String` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `root`, `review`; the dominant cost is a single pass (for-of over ["#seek", "#start", "#end"]), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function configureAutoMovieReviewControls(
  root: HTMLElement,
  review: {
    /** Available range, seconds. */ available: readonly [number, number];
    /** Admitted interval and speed. */ interval: {
      start: number;
      end: number;
      speed: number;
    };
    /** Status text, such as the source mode and extent. */ label: string;
  },
): void {
  const element = <T extends HTMLElement>(selector: string): T => {
    const found: T | null = root.querySelector<T>(selector);
    if (!found) throw new Error(`Missing review control ${selector}`);
    return found;
  };
  element("header p").textContent = review.label;
  for (const selector of ["#seek", "#start", "#end"]) {
    element<HTMLInputElement>(selector).min = String(review.available[0]);
    element<HTMLInputElement>(selector).max = String(review.available[1]);
  }
  element<HTMLInputElement>("#start").value = String(review.interval.start);
  element<HTMLInputElement>("#end").value = String(review.interval.end);
  element<HTMLSelectElement>("#speed").value = String(review.interval.speed);
}
