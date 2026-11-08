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
