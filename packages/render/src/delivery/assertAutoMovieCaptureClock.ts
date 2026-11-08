/**
 * Refuse a capture page that is not ready or does not expose the commissioned
 * clock, before any sound is prepared or pixel captured: the page must be
 * ready, report the commissioned duration and frame rate, and count exactly
 * `durationSeconds * fps` frames, an integer. Readiness is no visual or
 * physical acceptance.
 *
 * @param host Values read from the capture page.
 * @param expected The commissioned duration and rate.
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
