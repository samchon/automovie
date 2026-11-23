import type {
  IAutoMovieEnginePerformShotGateContext,
  IAutoMoviePerformShotFrameJob,
} from "@automovie/interface";

/**
 * Sort the live camera's frame moves by start, in place, and refuse moves that
 * double-book the camera.
 *
 * Two moves starting within `1e-9` s of each other are one `range` violation at
 * the later move's `start`, asking for one framing per instant. An explicit
 * duration that runs, clipped to the shot, more than `1e-9` s past the next
 * move's start is another. An `"auto"` duration yields to the next move by
 * definition, so it never overlaps. The sorted order is the one the blocking
 * gate, the camera compile and `cameraIntent` read.
 *
 * @param context The shot's staged tables and collector.
 * @param frames The frame jobs; sorted in place by `action.start`.
 */
export function gatePerformShotFrameOverlaps(
  context: IAutoMovieEnginePerformShotGateContext,
  frames: IAutoMoviePerformShotFrameJob[],
): void {
  frames.sort(
    (
      a: IAutoMoviePerformShotFrameJob,
      b: IAutoMoviePerformShotFrameJob,
    ): number => a.action.start - b.action.start,
  );
  for (let i: number = 0; i + 1 < frames.length; ++i) {
    const move: IAutoMoviePerformShotFrameJob = frames[i]!;
    const next: IAutoMoviePerformShotFrameJob = frames[i + 1]!;
    const path: string = `${context.base}[${next.index}].start`;
    if (next.action.start <= move.action.start + 1e-9) {
      context.out.push(
        "range",
        path,
        `frame moves share the same start time ${next.action.start}s on the live camera; choose one framing for that instant`,
        next.action.start,
      );
      continue;
    }
    if (move.action.duration === "auto") continue;
    const end: number = Math.min(
      move.action.start + move.action.duration,
      context.performance.duration,
    );
    if (end > next.action.start + 1e-9)
      context.out.push(
        "range",
        path,
        `frame moves overlap, the previous move runs until ${end}s, but this one starts at ${next.action.start}s`,
        next.action.start,
      );
  }
}
