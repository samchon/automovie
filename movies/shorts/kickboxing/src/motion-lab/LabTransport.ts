/**
 * One host clock for deterministic module playback and seek.
 *
 * @evidence contracts/common.md#implementation-and-ownership performance timestamps advance only this clock; the supplied evaluator owns every body update. Pause, seek and speed changes rebase the same clock, with a closed duration endpoint.
 * @evidence contracts/common.md#authoring-interface Seconds are action-local and speed is positive. Host calls tick once per Viewer frame and retires the clock by pausing.
 */
export class LabTransport {
  /**
   * Require transport belonging to the currently admitted requested selection.
   * @evidence contracts/common.md#implementation-and-ownership Rejects an absent clock and a retained old clock after selection failure before any evaluator or playback flag can change. Retaining the previous visible scene never admits the new request.
   * @evidence contracts/common.md#authoring-interface The host supplies its synchronous selection outcome. This pure guard returns the same loaded transport; it owns no renderer or actor and never creates a fallback clock.
   */
  public static requireLoaded(
    transport: LabTransport | undefined,
    selectionLoaded: boolean,
  ): LabTransport {
    if (!transport) throw new Error("No action is loaded");
    if (!selectionLoaded)
      throw new Error(
        "The requested action was refused; the previous action is retained and paused",
      );
    return transport;
  }

  /** Current local sample time in seconds. */
  public seconds: number = 0;
  /** Playback state; selection changes pause before replacing a case. */
  public playing: boolean = false;
  /** Real seconds to local seconds multiplier. */
  public speed: number = 1;
  /** Last browser time in milliseconds, owned only while playing. */
  private previous: number = 0;
  /** Exact closed playback interval; endpoints are never quantized to milliseconds. */
  public readonly start: number;
  /** Exact closed playback endpoint, at most the complete action duration. */
  public readonly end: number;

  /** Bind one module case evaluator and its exact maximum local time. */
  public constructor(
    public duration: number,
    private readonly evaluate: (seconds: number) => void,
    bounds: { start: number; end: number } = { start: 0, end: duration },
  ) {
    if (
      !Number.isFinite(duration) ||
      duration <= 0 ||
      !Number.isFinite(bounds.start) ||
      !Number.isFinite(bounds.end) ||
      bounds.start < 0 ||
      bounds.end > duration ||
      bounds.start >= bounds.end
    )
      throw new Error(
        "Playback requires a finite nonempty interval within the action duration",
      );
    this.start = bounds.start;
    this.end = bounds.end;
    this.seconds = this.start;
  }

  /**
   * Read an optional exact startup playback interval from URL seconds.
   * @evidence contracts/common.md#implementation-and-ownership Missing start/end default to zero/full duration; explicit empty, nonfinite, inverted or out-of-duration bounds refuse before sampling. No decimal grid rounds an endpoint.
   * @evidence contracts/common.md#authoring-interface URL parameters start and end use local seconds and the same closed interval as seek, keyboard and playback. This method creates no actor or renderer.
   */
  public static bounds(
    duration: number,
    query: URLSearchParams,
  ): { start: number; end: number } {
    const read: (name: string, fallback: number) => number = (
      name: string,
      fallback: number,
    ): number => {
      const value: string | null = query.get(name);
      if (value !== null && !value.trim())
        throw new Error(`URL ${name} must contain local seconds`);
      return value === null ? fallback : Number(value);
    };
    const bounds: { start: number; end: number } = {
      start: read("start", 0),
      end: read("end", duration),
    };
    if (
      !Number.isFinite(duration) ||
      !Number.isFinite(bounds.start) ||
      !Number.isFinite(bounds.end) ||
      bounds.start < 0 ||
      bounds.end > duration ||
      bounds.start >= bounds.end
    )
      throw new Error(
        "URL start/end must form a nonempty interval within the action duration",
      );
    return bounds;
  }

  /**
   * Seek keyboard controls through the same exact interval as direct seek.
   * @evidence contracts/common.md#implementation-and-ownership Home/End use the exact closed endpoints; arrows move one millisecond and Page keys one tenth second, clamped once to the same bounds. End therefore reaches a duration with a fractional millisecond.
   * @evidence contracts/common.md#authoring-interface Returns false for unrelated keys without evaluating. A recognized key pauses and samples through seek; no browser range-step rounding is used.
   */
  public move(key: string): boolean {
    const increments: Record<string, number> = {
      ArrowLeft: -0.001,
      ArrowDown: -0.001,
      ArrowRight: 0.001,
      ArrowUp: 0.001,
      PageDown: -0.1,
      PageUp: 0.1,
    };
    const delta: number | undefined = increments[key];
    if (key !== "Home" && key !== "End" && delta === undefined) return false;
    this.seek(
      key === "Home"
        ? this.start
        : key === "End"
          ? this.end
          : Math.max(this.start, Math.min(this.end, this.seconds + delta!)),
    );
    return true;
  }

  /**
   * Start or resume; an ended interval restarts at its exact start.
   * @evidence contracts/common.md#implementation-and-ownership Rebases the single performance clock and restarts only a completed selected case.
   * @evidence contracts/common.md#authoring-interface Does not create a second renderer or integrate pose state; tick consumes the same local seconds.
   */
  public play(): void {
    if (this.seconds >= this.end) this.seek(this.start);
    this.previous = performance.now();
    this.playing = true;
  }

  /**
   * Suspend without advancing the module clock.
   * @evidence contracts/common.md#implementation-and-ownership Clears only the owned playback flag; the currently displayed sample remains unchanged.
   * @evidence contracts/common.md#authoring-interface Safe before or after playback and creates no resources.
   */
  public pause(): void {
    this.playing = false;
  }

  /**
   * Seek exactly and pause, independent of previous sample history.
   * @evidence contracts/common.md#implementation-and-ownership Validates the finite closed interval before invoking the same evaluator at an explicit local time.
   * @evidence contracts/common.md#authoring-interface Invalid time throws before evaluation; seeking pauses playback and does not imply physical admission. A failed evaluator cannot commit a new clock time.
   */
  public seek(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds < this.start || seconds > this.end)
      throw new Error("Seek must remain inside the selected playback interval");
    this.pause();
    this.evaluate(seconds);
    this.seconds = seconds;
  }

  /**
   * Advance once per real Viewer frame and clamp the final exact endpoint.
   * @evidence contracts/common.md#implementation-and-ownership Uses elapsed performance time and the owned speed once per frame, evaluates the resulting local sample, and pauses exactly at duration.
   * @evidence contracts/common.md#authoring-interface Host calls this once per Viewer frame; real rendering cadence is independent of deterministic action sampling.
   */
  public tick(): void {
    if (!this.playing) return;
    const now: number = performance.now();
    const seconds: number = Math.min(
      this.end,
      this.seconds + ((now - this.previous) / 1000) * this.speed,
    );
    this.previous = now;
    this.evaluate(seconds);
    this.seconds = seconds;
    if (this.seconds >= this.end) this.pause();
  }
}
