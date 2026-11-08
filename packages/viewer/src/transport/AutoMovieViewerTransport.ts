/**
 * One authoritative review clock for a deterministic film producer: exact
 * seeks, interval playback at a review speed, optional synchronized sound and
 * capture freezes, all through one synchronous `place(seconds)` producer.
 *
 * A placement commits the displayed second only after the producer succeeds,
 * so a failed draw never masquerades as a sought frame. Playback anchors one
 * wall-clock origin (no integrated render deltas), snaps to the frame grid of
 * `fps` and draws the interval's exact end before pausing. Sound starts
 * before the anchor and a generation token cancels a start that a later
 * pause, seek or speed change superseded. The clock source is injectable, so
 * the logic runs in milliseconds without a browser.
 */
export class AutoMovieViewerTransport {
  /** Last successfully displayed second. */
  public seconds: number;

  /** Whether the clock is running. */
  public playing: boolean = false;

  /** Whether playback starts the sound source. */
  public sound: boolean = true;

  /** Last producer or sound refusal. */
  public error: string | null = null;

  /** Closed playback interval inside the available range. */
  public interval: [number, number];

  /** The source's available range; review bounds cannot widen it. */
  public readonly available: readonly [number, number];

  /** Current review speed. */
  private rate: number = 1;

  /** Wall anchor, milliseconds. */
  private wall: number = 0;

  /** Film second at the anchor. */
  private origin: number = 0;

  /** Pending start generation. */
  private generation: number = 0;

  /** Borrowed collaborators and settings. */
  private readonly options: AutoMovieViewerTransport.IOptions;

  /**
   * A transport over a producer.
   *
   * @param options Producer, range, frame rate, speeds, sound and clock.
   */
  public constructor(options: AutoMovieViewerTransport.IOptions) {
    const available: readonly [number, number] = options.available;
    if (
      !available.every(Number.isFinite) ||
      available[0] < 0 ||
      available[0] >= available[1] ||
      !(options.fps > 0)
    )
      throw new Error("Invalid transport range or frame rate");
    this.options = options;
    this.available = Object.freeze([available[0], available[1]] as [
      number,
      number,
    ]);
    this.seconds = available[0];
    this.interval = [available[0], available[1]];
  }

  /** Current review speed, film seconds per wall second. */
  public get speed(): number {
    return this.rate;
  }

  /** Replace the review speed; pauses first, and refuses an unsupported speed. */
  public set speed(value: number) {
    if (!(this.options.speeds ?? [0.25, 0.5, 1]).includes(value))
      throw new Error(`Unsupported review speed ${value}`);
    this.pause();
    this.rate = value;
  }

  /**
   * Start playback from the committed second, after the sound starts.
   *
   * @returns When the clock is anchored, or the start was superseded.
   */
  public async play(): Promise<void> {
    this.pause();
    if (this.seconds < this.interval[0] || this.seconds >= this.interval[1])
      this.seek(this.interval[0]);
    const generation: number = ++this.generation;
    this.error = null;
    try {
      if (this.sound && this.options.audio)
        await this.options.audio.play(this.seconds, this.rate);
      if (generation !== this.generation) return;
      this.wall = this.now();
      this.origin = this.seconds;
      this.playing = true;
    } catch (error: unknown) {
      if (generation !== this.generation) return;
      this.error = error instanceof Error ? error.message : String(error);
      this.pause();
      throw error;
    }
  }

  /** Stop playback and sound without moving the displayed second. */
  public pause(): void {
    this.generation++;
    this.playing = false;
    this.options.audio?.pause();
  }

  /**
   * Place an exact second inside the available range.
   *
   * @param seconds The second.
   */
  public seek(seconds: number): void {
    if (
      !Number.isFinite(seconds) ||
      seconds < this.available[0] ||
      seconds > this.available[1]
    )
      throw new Error(
        `Seek must remain inside [${this.available[0]},${this.available[1]}]`,
      );
    this.pause();
    try {
      this.options.place(seconds);
      this.seconds = seconds;
      this.error = null;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Advance a running clock to the frame due now; call once per display frame.
   *
   * @returns Whether a new frame was placed.
   */
  public tick(): boolean {
    if (!this.playing) return false;
    const fps: number = this.options.fps;
    const actual: number = Math.min(
      this.interval[1],
      this.origin + ((this.now() - this.wall) * this.rate) / 1000,
    );
    const seconds: number =
      actual === this.interval[1]
        ? actual
        : Math.max(this.origin, Math.floor(actual * fps) / fps);
    let changed: boolean = false;
    try {
      if (seconds !== this.seconds) {
        this.options.place(seconds);
        this.seconds = seconds;
        changed = true;
      }
      if (actual === this.interval[1]) this.pause();
      return changed;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : String(error);
      this.pause();
      throw error;
    }
  }

  /**
   * Select a playback interval by placing its start first.
   *
   * @param start Start second.
   * @param end End second, after the start.
   */
  public setInterval(start: number, end: number): void {
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < this.available[0] ||
      end > this.available[1] ||
      end <= start
    )
      throw new Error(
        `Review interval must remain inside [${this.available[0]},${this.available[1]}]`,
      );
    this.seek(start);
    this.interval = [start, end];
  }

  /**
   * Pause for a capture and return a once-only release that may resume.
   *
   * @returns The release; `true` resumes a formerly playing clock.
   */
  public freeze(): (resume: boolean) => void {
    const playing: boolean = this.playing;
    this.pause();
    let released: boolean = false;
    return (resume: boolean): void => {
      if (released) return;
      released = true;
      if (resume && playing) void this.play().catch((): void => {});
    };
  }

  /** The injected or performance clock, milliseconds. */
  private now(): number {
    return this.options.now?.() ?? performance.now();
  }
}
/** Companion types of {@link AutoMovieViewerTransport}. */
export namespace AutoMovieViewerTransport {
  /** A synchronized sound source. */
  export interface IAudio {
    /** Start from a film second at a speed; resolves once sounding. */
    play(seconds: number, rate: number): Promise<void>;

    /** Stop any current sound. */
    pause(): void;
  }

  /** Transport settings and collaborators. */
  export interface IOptions {
    /** The synchronous producer that displays a second; throws on failure. */
    place(seconds: number): void;

    /** Available source range, seconds. */
    available: readonly [number, number];

    /** Frame grid of playback, frames per second. */
    fps: number;

    /** Supported review speeds; 0.25, 0.5 and 1 by default. */
    speeds?: readonly number[];

    /** Optional sound source. */
    audio?: IAudio;

    /** Clock in milliseconds; `performance.now` by default. */
    now?(): number;
  }
}
