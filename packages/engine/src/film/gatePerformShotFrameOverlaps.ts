import { IPerformShotFrameJob } from "./IPerformShotFrameJob";
import { IPerformShotGateContext } from "./IPerformShotGateContext";

/**
 * Sort the live camera's frame moves by start, in place, and refuse moves that
 * double-book the camera.
 *
 * Two moves starting within `1e-9` s of each other are one `range` violation
 * at the later move's `start`, asking for one framing per instant. An explicit
 * duration that runs, clipped to the shot, more than `1e-9` s past the next
 * move's start is another. An `"auto"` duration yields to the next move by
 * definition, so it never overlaps. The sorted order is the one the blocking
 * gate, the camera compile and `cameraIntent` read.
 *
 * @param context The shot's staged tables and collector.
 * @param frames The frame jobs; sorted in place by `action.start`.
 *
 * @evidence contracts/common.md#principled-implementation Once moves are sorted by start, two moves overlap exactly when some move overlaps its successor, so comparing neighbours is complete; the sort is stable, so equal starts keep authoring order, and the `1e-9` s tolerance absorbs only floating start arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design The ordering every later camera stage depends on is made once here, before the blocking and camera gates read the lead move.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every move is held to the same rule; an `"auto"` move is exempt because its span is defined to end at the next start, not because of who authored it.
 * @evidence contracts/common.md#meaningful-documentation States both violations with their tolerance and path, why `"auto"` never overlaps, the in-place sort, and who reads the sorted order.
 * @evidence contracts/performance.md#efficient-algorithms One `O(f log f)` sort of the frame moves and one linear pass over neighbours, instead of comparing every pair.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One pass over one shot's frame moves; the sorted list itself is the result later stages reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reorders the caller's list and pushes violations into the shared collector; it allocates and keeps nothing else.
 */
export const gatePerformShotFrameOverlaps = (
  context: IPerformShotGateContext,
  frames: IPerformShotFrameJob[],
): void => {
  frames.sort(
    (a: IPerformShotFrameJob, b: IPerformShotFrameJob): number =>
      a.action.start - b.action.start,
  );
  for (let i: number = 0; i + 1 < frames.length; ++i) {
    const move: IPerformShotFrameJob = frames[i]!;
    const next: IPerformShotFrameJob = frames[i + 1]!;
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
};
