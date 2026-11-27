/**
 * The inspector's playhead: the second shown, the subject's duration, whether
 * it plays and how fast, kept outside React.
 *
 * The render loop advances it and reads it directly every frame. The time
 * readout reads its snapshot through `useSyncExternalStore` with `subscribe`
 * and `getSnapshot`, and the time panel only whether it plays, so a playing
 * frame re-renders the readout alone and a start or stop also the panel's play
 * button. A snapshot is replaced, never changed, so its identity tells a reader
 * whether anything moved. Seconds stay within `[0, durationSeconds]`.
 *
 * The rate scales how fast the preview plays and is not part of the request: it
 * changes no picture, and the capture grammar's `rate` key, stills per second,
 * is a different quantity.
 *
 * ```ts
 * const seconds = useSyncExternalStore(
 *   playhead.subscribe,
 *   playhead.getSnapshot,
 * ).seconds;
 * ```
 */
export class AutoMovieViewerInspectorPlayhead {
  private snapshot_: AutoMovieViewerInspectorPlayhead.ISnapshot = {
    seconds: 0,
    durationSeconds: 0,
    playing: false,
    rate: 1,
    jump: 0,
  };
  private readonly listeners_: Set<() => void> = new Set<() => void>();

  /** Call `listener` after every change, until the returned function is called. */
  public readonly subscribe: (listener: () => void) => () => void = (
    listener: () => void,
  ): (() => void) => {
    this.listeners_.add(listener);
    return (): void => {
      this.listeners_.delete(listener);
    };
  };

  /** The current snapshot, the same object until something changes. */
  public readonly getSnapshot: () => AutoMovieViewerInspectorPlayhead.ISnapshot =
    (): AutoMovieViewerInspectorPlayhead.ISnapshot => this.snapshot_;

  /**
   * Set the subject's duration when an instance is ready, keeping the second
   * within it.
   *
   * It throws for a duration that is not positive.
   */
  public setDuration(durationSeconds: number): void {
    if (!(durationSeconds > 0))
      throw new Error(
        `Inspector duration ${durationSeconds} is not a positive number of seconds`,
      );
    this.change({
      durationSeconds,
      seconds: Math.min(this.snapshot_.seconds, durationSeconds),
    });
  }

  /**
   * Start playing; from the end, play starts again at zero, which counts as a
   * jump.
   */
  public play(): void {
    const { seconds, durationSeconds }: AutoMovieViewerInspectorPlayhead.ISnapshot =
      this.snapshot_;
    if (durationSeconds === 0) return;
    this.change(
      seconds >= durationSeconds
        ? { playing: true, seconds: 0, jump: this.snapshot_.jump + 1 }
        : { playing: true },
    );
  }

  /** Stop playing where the playhead is. */
  public pause(): void {
    this.change({ playing: false });
  }

  /**
   * Show one second, clamped to `[0, durationSeconds]`; playing continues from
   * it. Moving to another second counts as a jump.
   */
  public seek(seconds: number): void {
    const clamped: number = Math.min(
      Math.max(seconds, 0),
      this.snapshot_.durationSeconds,
    );
    if (clamped !== this.snapshot_.seconds)
      this.change({ seconds: clamped, jump: this.snapshot_.jump + 1 });
  }

  /**
   * Play `rate` subject seconds per wall second. It throws for a rate that is
   * not positive.
   */
  public setRate(rate: number): void {
    if (!(rate > 0))
      throw new Error(`Inspector rate ${rate} is not a positive number`);
    this.change({ rate });
  }

  /**
   * Move a playing playhead by `wallSeconds` of wall time times the rate,
   * stopping at the end. A paused playhead does not move.
   */
  public advance(wallSeconds: number): void {
    const now: AutoMovieViewerInspectorPlayhead.ISnapshot = this.snapshot_;
    if (!now.playing || !(wallSeconds > 0)) return;
    const seconds: number = now.seconds + wallSeconds * now.rate;
    this.change(
      seconds >= now.durationSeconds
        ? { seconds: now.durationSeconds, playing: false }
        : { seconds },
    );
  }

  /*
   * Replace the snapshot when a member differs, then tell every listener.
   */
  private change(patch: Partial<AutoMovieViewerInspectorPlayhead.ISnapshot>): void {
    const next: AutoMovieViewerInspectorPlayhead.ISnapshot = {
      ...this.snapshot_,
      ...patch,
    };
    if (
      next.seconds === this.snapshot_.seconds &&
      next.durationSeconds === this.snapshot_.durationSeconds &&
      next.playing === this.snapshot_.playing &&
      next.rate === this.snapshot_.rate &&
      next.jump === this.snapshot_.jump
    )
      return;
    this.snapshot_ = next;
    for (const listener of [...this.listeners_]) listener();
  }
}
export namespace AutoMovieViewerInspectorPlayhead {
  /** One immutable state of the playhead. */
  export interface ISnapshot {
    /** The second shown, subject seconds. */
    seconds: number;

    /** The subject's duration in seconds, zero until an instance is ready. */
    durationSeconds: number;

    /** Whether the loop advances the playhead. */
    playing: boolean;

    /** Subject seconds played per wall second, positive. */
    rate: number;

    /**
     * Number of seeks to another second and restarts from the end so far; two
     * snapshots with the same count are joined by playback alone.
     */
    jump: number;
  }
}
