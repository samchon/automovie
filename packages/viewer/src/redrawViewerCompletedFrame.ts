import type { IAutoMovieViewerCompletedFrame } from "./IAutoMovieViewerCompletedFrame.js";

/**
 * Admit an original synchronous redraw only from a new completed observation.
 * Explicit completion is preferred. A legacy void callback may instead expose
 * a new completed-frame record; an unchanged prior record cannot attest a draw.
 * An absent record time inherits the requested original-producer time, while a
 * supplied time must agree exactly. The producer must throw on refusal.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Compares the completed revision around the original producer call; explicit completion must report requested seconds. Without explicit completion, only a distinct newly supplied producer record can be published, and its declared clock must match. No previous observation is relabeled as a new draw.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Extracts mountViewer's actual redraw-admission boundary while leaving rendering, source admission and completion publication with their existing owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Fulfilled void remains supported and thrown refusal propagates unchanged; stale or mismatched records cannot become successful requested frames. Record freshness is producer attestation, not independent pixel or physical-admission proof.
 * @evidence contracts/development/common.md#meaningful-documentation States explicit and legacy completion paths, exact clock agreement, absent-clock inheritance and original-producer refusal responsibility.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-count revision/record/clock reads and one original producer invocation use O(1) coordination without traversing scenes or reading pixels.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the original completed observation but never reuses an old record to stand in for a new effect; distinct requested redraws invoke the producer separately.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Borrows callbacks and frame records only for this synchronous invocation and acquires no task, renderer or resource lease.
 */
export function redrawViewerCompletedFrame(
  seconds: number,
  options: {
    /** Actual completed publication count. */
    completedCount: () => number;
    /** Actual last completed scene seconds. */
    completedSeconds: () => number;
    /** Current original-producer observation, absent before any completed draw. */
    readFrame: () =>
      | Omit<IAutoMovieViewerCompletedFrame, "control">
      | undefined;
    /** Original draw; must throw if it refuses the requested state. */
    produce: (seconds: number) => void;
    /** Publish a newly supplied legacy producer observation at these seconds. */
    publish: (
      frame: Omit<IAutoMovieViewerCompletedFrame, "control">,
      seconds: number,
    ) => void;
  },
): void {
  if (!Number.isFinite(seconds) || seconds < 0)
    throw new Error("A redraw requires finite nonnegative seconds.");
  const before: number = options.completedCount();
  const previous: Omit<IAutoMovieViewerCompletedFrame, "control"> | undefined =
    options.readFrame();
  options.produce(seconds);
  if (options.completedCount() === before) {
    const current: Omit<IAutoMovieViewerCompletedFrame, "control"> | undefined =
      options.readFrame();
    if (current === undefined || current === previous)
      throw new Error(
        "The original viewer producer did not complete a new redraw.",
      );
    if (
      current.elapsedSeconds !== undefined &&
      current.elapsedSeconds !== seconds
    )
      throw new Error(
        "The original viewer producer completed a different scene time.",
      );
    options.publish(current, seconds);
  }
  if (
    options.completedCount() === before ||
    options.completedSeconds() !== seconds
  )
    throw new Error(
      "The original viewer producer did not complete the requested scene time.",
    );
}
