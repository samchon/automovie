/**
 * Whether the visitor asked for reduced motion, so a clock waits for a
 * request before it plays. On the server, where there is no visitor, it says
 * no; a page's first render therefore never reads it, and starts its clocks
 * paused.
 *
 * @returns Whether `prefers-reduced-motion: reduce` matches.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
