/**
 * The inspector's playhead: the second shown, the subject's duration, whether it plays and how fast, kept outside React.
 *
 * The render loop advances it and reads it directly every frame. The time readout reads its snapshot through `useSyncExternalStore` with `subscribe` and `getSnapshot`, and the time panel only whether it plays, so a playing frame re-renders the readout alone and a start or stop also the panel's play button. A snapshot is replaced, never changed, so its identity tells a reader whether anything moved. Seconds stay within `[0, durationSeconds]`.
 *
 * The rate scales how fast the preview plays and is not part of the request: it changes no picture, and the capture grammar's `rate` key, stills per second, is a different quantity.
 *
 * ```ts
 * const seconds = useSyncExternalStore(playhead.subscribe, playhead.getSnapshot).seconds;
 * ```
 *
 * @evidence contracts/development/design.md#principled-representation Seconds and duration are subject seconds, the rate is a positive multiplier of wall time and playing is a boolean; the snapshot is one immutable record so the external-store contract's identity comparison is exact.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the inspector, one per mounted component; the scene mount calls `setDuration`, `seek` and `advance`, the time panel `play`, `pause` and `setRate` and subscribes to the playing flag, the readout `seek`, `subscribe` and `getSnapshot`, and the inspector's keys, through `handleAutoMovieInspectorKey`, `play`, `pause`, `seek` and `getSnapshot`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `subscribe` and `getSnapshot` are bound properties, so React keeps one subscription across renders instead of resubscribing to a new function each time.
 * @evidence contracts/development/common.md#meaningful-documentation States who moves and who reads the playhead and what each reader re-renders on, why it lives outside React, the snapshot's identity rule, the range and why the rate is not a request member.
 */
export class AutoMovieInspectorPlayhead {
  private snapshot_: AutoMovieInspectorPlayhead.ISnapshot = {
    seconds: 0,
    durationSeconds: 0,
    playing: false,
    rate: 1,
  };
  private readonly listeners_: Set<() => void> = new Set<() => void>();

  /**
   * Call `listener` after every change, until the returned function is called.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when the listener runs and how it is removed.
   * @evidence contracts/development/implementation.md#principled-implementation The external-store contract React's `useSyncExternalStore` reads: subscribe returns its own unsubscribe.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One set of listeners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same listener given twice is held once, as a set holds it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time to add and to remove.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A registration computes nothing.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the listener until its unsubscribe runs; the set grows by one per live subscription, which React keeps at two per mounted inspector, the time panel's and the readout's.
   */
  public readonly subscribe: (listener: () => void) => () => void = (
    listener: () => void,
  ): (() => void) => {
    this.listeners_.add(listener);
    return (): void => {
      this.listeners_.delete(listener);
    };
  };

  /**
   * The current snapshot, the same object until something changes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the identity rule.
   * @evidence contracts/development/implementation.md#principled-implementation `useSyncExternalStore` requires a cached snapshot, or it renders forever.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns the held record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never builds a record on read.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Returns what is held.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Allocates nothing.
   */
  public readonly getSnapshot: () => AutoMovieInspectorPlayhead.ISnapshot =
    (): AutoMovieInspectorPlayhead.ISnapshot => this.snapshot_;

  /**
   * Set the subject's duration when an instance is ready, keeping the second within it.
   *
   * It throws for a duration that is not a positive finite number.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when it is called, the clamp and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Seconds beyond the subject's end show nothing of it, so the second is clamped to the new range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Check, then one change.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bad duration is refused instead of clamping every second to zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant plus one call per listener.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A state change.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Replaces one record.
   */
  public setDuration(durationSeconds: number): void {
    if (!(Number.isFinite(durationSeconds) && durationSeconds > 0))
      throw new Error(
        `Inspector duration ${durationSeconds} is not a positive number of seconds`,
      );
    this.change({
      durationSeconds,
      seconds: Math.min(this.snapshot_.seconds, durationSeconds),
    });
  }

  /**
   * Start playing; from the end, play starts again at zero.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the restart at the end.
   * @evidence contracts/development/implementation.md#principled-implementation A playhead at the end has nothing left to play, so play means the whole subject again.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One change.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Playing an unready subject (duration zero) is a no-op rather than a loop at zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant plus one call per listener.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A state change.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Replaces one record.
   */
  public play(): void {
    const { seconds, durationSeconds }: AutoMovieInspectorPlayhead.ISnapshot =
      this.snapshot_;
    if (durationSeconds === 0) return;
    this.change({
      playing: true,
      seconds: seconds >= durationSeconds ? 0 : seconds,
    });
  }

  /**
   * Stop playing where the playhead is.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the second is kept.
   * @evidence contracts/development/implementation.md#principled-implementation The paused second is the picture the request then names.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One change.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Pausing a paused playhead changes nothing and notifies no one.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant plus one call per listener.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A state change.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Replaces one record.
   */
  public pause(): void {
    this.change({ playing: false });
  }

  /**
   * Show one second, clamped to `[0, durationSeconds]`; playing continues from it. A second that is not finite is refused.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the clamp, that playing continues and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A slider or an address can ask past either end, and the nearest second the subject has is the one drawn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Check, clamp, change.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts NaN is refused instead of clamped to an end.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant plus one call per listener.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A state change.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Replaces one record.
   */
  public seek(seconds: number): void {
    if (!Number.isFinite(seconds))
      throw new Error(`Inspector second ${seconds} is not a number`);
    this.change({
      seconds: Math.min(Math.max(seconds, 0), this.snapshot_.durationSeconds),
    });
  }

  /**
   * Play `rate` subject seconds per wall second. It throws for a rate that is not positive and finite.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The rate multiplies the wall time `advance` is given.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Check, change.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Zero and negative rates are refused; pausing is `pause`.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant plus one call per listener.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A state change.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Replaces one record.
   */
  public setRate(rate: number): void {
    if (!(Number.isFinite(rate) && rate > 0))
      throw new Error(`Inspector rate ${rate} is not a positive number`);
    this.change({ rate });
  }

  /**
   * Move a playing playhead by `wallSeconds` of wall time times the rate, stopping at the end. A paused playhead does not move.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the stop at the end and the paused case.
   * @evidence contracts/development/implementation.md#principled-implementation Subject time is wall time scaled by the rate; reaching the end pauses there so the last picture stays.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One change from one sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Negative or non-finite wall time, such as a clock step backwards, moves nothing.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant plus one call per listener, once per animation frame while playing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A state change.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Replaces one record.
   */
  public advance(wallSeconds: number): void {
    const now: AutoMovieInspectorPlayhead.ISnapshot = this.snapshot_;
    if (!now.playing || !(Number.isFinite(wallSeconds) && wallSeconds > 0))
      return;
    const seconds: number = now.seconds + wallSeconds * now.rate;
    this.change(
      seconds >= now.durationSeconds
        ? { seconds: now.durationSeconds, playing: false }
        : { seconds },
    );
  }

  /** Replace the snapshot when a member differs, then tell every listener. */
  private change(patch: Partial<AutoMovieInspectorPlayhead.ISnapshot>): void {
    const next: AutoMovieInspectorPlayhead.ISnapshot = {
      ...this.snapshot_,
      ...patch,
    };
    if (
      next.seconds === this.snapshot_.seconds &&
      next.durationSeconds === this.snapshot_.durationSeconds &&
      next.playing === this.snapshot_.playing &&
      next.rate === this.snapshot_.rate
    )
      return;
    this.snapshot_ = next;
    for (const listener of [...this.listeners_]) listener();
  }
}
export namespace AutoMovieInspectorPlayhead {
  /**
   * One immutable state of the playhead.
   *
   * @evidence contracts/development/design.md#principled-representation Subject seconds and duration, a wall-time multiplier and a playing flag, with `0 <= seconds <= durationSeconds` kept by the playhead.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The four members the readout shows and the loop reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A duration of zero means no instance is ready yet, not a subject that lasts no time.
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and the zero duration.
   */
  export interface ISnapshot {
    /** The second shown, subject seconds. */
    seconds: number;

    /** The subject's duration in seconds, zero until an instance is ready. */
    durationSeconds: number;

    /** Whether the loop advances the playhead. */
    playing: boolean;

    /** Subject seconds played per wall second, positive. */
    rate: number;
  }
}
