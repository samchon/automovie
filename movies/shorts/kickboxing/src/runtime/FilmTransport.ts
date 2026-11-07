import { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import type { MovieAudio } from "../sound/MovieAudio";

/**
 * One authoritative clock for actual film placement, browser sound and capture freezes.
 *
 * @evidence contracts/common.md#implementation-and-ownership A successful synchronous placement commits time only after the original producer has evaluated and drawn. One native audio source is awaited before anchoring wall time. Generation tokens cancel late starts; pause, seek, speed, interval and freeze never create another clock.
 * @evidence contracts/common.md#authoring-interface Film time stays in [0,180] and review speed is .25, .5 or 1. The producer owns atomic actor/camera/draw placement and errors. Sound and complete film preparation remain separately owned.
 */
export class FilmTransport {
  /** Successfully displayed absolute film second. */
  public seconds: number;
  /** One native clock is active only while this is true. */
  public playing: boolean = false;
  /** Audible review preference; silent capture never starts a source. */
  public sound: boolean = true;
  /** Actual last producer or audio refusal. */
  public error: string | null = null;
  /** Closed interval used by playback and keyboard review. */
  public interval: [number, number] = [0, FilmPlan.duration];
  /** Actual source availability; review bounds cannot expand it. */
  public readonly available: readonly [number, number];
  /** Validated local multiplier, independent of the output frame schedule. */
  private rate: number = 1;
  /** One wall-time anchor, milliseconds. */
  private wall: number = 0;
  /** Film second at that anchor. */
  private origin: number = 0;
  /** Pending asynchronous playback generation. */
  private generation: number = 0;

  /** Borrow the shared soundtrack and the actual completed-frame producer. */
  public constructor(
    private readonly audio: Pick<MovieAudio, "play" | "pause" | "diagnostics">,
    private readonly place: (seconds: number) => void,
    available: readonly [number, number] = [0, FilmPlan.duration],
  ) {
    if (
      !available.every(Number.isFinite) ||
      available[0] < 0 ||
      available[1] > FilmPlan.duration ||
      available[0] >= available[1]
    )
      throw new Error("Invalid available film interval");
    this.available = Object.freeze([...available] as [number, number]);
    this.seconds = available[0];
    this.interval = [...available];
  }

  /** Current validated film-seconds-per-wall-second multiplier; reading advances no clock. */
  public get speed(): number {
    return this.rate;
  }

  /**
   * Replace review speed through the same paused clock boundary.
   * Supports .25, .5 and 1. Invalid input changes nothing; a valid change pauses
   * the original clock/audio without changing its committed film second.
   */
  public set speed(value: number) {
    if (![0.25, 0.5, 1].includes(value))
      throw new Error("Supported review speeds are .25, .5 and 1");
    this.pause();
    this.rate = value;
  }

  /**
   * Start sound and the one wall anchor from the same committed film second.
   * @evidence contracts/common.md#implementation-and-ownership Cancels earlier start generations, seeks an ended interval to its start, awaits the shared native soundtrack and anchors only if this start is still current. Any refusal pauses and retains its cause.
   * @evidence contracts/common.md#authoring-interface Call from a user gesture for audible playback. A running audio context is not listening acceptance, and silent review explicitly skips scheduling.
   */
  public async play(): Promise<void> {
    this.pause();
    if (this.seconds < this.interval[0] || this.seconds >= this.interval[1])
      this.seek(this.interval[0]);
    const generation: number = ++this.generation;
    this.error = null;
    try {
      if (this.sound) await this.audio.play(this.seconds, this.rate);
      if (generation !== this.generation) return;
      if (this.sound && this.audio.diagnostics().state !== "playing")
        throw new Error("The shared soundtrack did not start");
      this.wall = performance.now();
      this.origin = this.seconds;
      this.playing = true;
    } catch (error: unknown) {
      if (generation !== this.generation) return;
      this.error = error instanceof Error ? error.message : String(error);
      this.pause();
      throw error;
    }
  }

  /**
   * Cancel playback without altering the last completed display time.
   * @evidence contracts/common.md#implementation-and-ownership Invalidates pending starts and cancels only the borrowed soundtrack's current native source. No actor or camera is evaluated.
   * @evidence contracts/common.md#authoring-interface Idempotent for time. The audio object remains owned and ultimately disposed by the Viewer.
   */
  public pause(): void {
    this.generation++;
    this.playing = false;
    this.audio.pause();
  }

  /**
   * Place an exact requested time before committing it to the transport.
   * @evidence contracts/common.md#implementation-and-ownership Validates the closed full-film range, pauses native playback, calls the same synchronous real producer and updates seconds only after success. A producer failure therefore cannot masquerade as a successfully sought frame.
   * @evidence contracts/common.md#authoring-interface Arbitrary full-film seek is supported after preparation; interval bounds control playback rather than prohibit inspection elsewhere. Invalid input changes nothing; failed placement retains the previous time and stores its error.
   */
  public seek(seconds: number): void {
    if (
      !Number.isFinite(seconds) ||
      seconds < this.available[0] ||
      seconds > this.available[1]
    )
      throw new Error(
        `Film seek must remain inside [${this.available[0]},${this.available[1]}]`,
      );
    this.pause();
    try {
      this.place(seconds);
      this.seconds = seconds;
      this.error = null;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Advance at the selected review speed through the same exact producer.
   * @evidence contracts/common.md#implementation-and-ownership Resolves wall time from one stable anchor rather than integrating render deltas. Duplicate 30fps samples are skipped; the exact review endpoint is drawn before pausing. Placement failure pauses sound and preserves the previous committed film second.
   * @evidence contracts/common.md#authoring-interface The Viewer calls tick at its native RAF cadence. Returns whether a new frame was completed; false while paused performs no motion, matrix or draw work.
   */
  public tick(): boolean {
    if (!this.playing) return false;
    const actual: number = Math.min(
      this.interval[1],
      this.origin + ((performance.now() - this.wall) * this.rate) / 1000,
    );
    const seconds: number =
      actual === this.interval[1]
        ? actual
        : Math.max(
            this.origin,
            Math.floor(actual * FilmPlan.fps) / FilmPlan.fps,
          );
    let changed: boolean = false;
    try {
      if (seconds !== this.seconds) {
        this.place(seconds);
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
   * Select a nonempty review interval through one successful start placement.
   * @evidence contracts/common.md#implementation-and-ownership Checks both endpoints, places the new start and commits the interval afterwards. Failed placement therefore leaves the old interval and displayed time intact.
   * @evidence contracts/common.md#authoring-interface Requires finite 0<=start<end<=180 seconds. The whole-film output schedule remains 5400 frames regardless of the review interval.
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
   * Lease the current producer for the public Viewer's freeze/capture mechanism.
   * @evidence contracts/common.md#implementation-and-ownership Records prior playback, pauses once and returns an idempotent release. Only a requested release of a formerly playing producer resumes through the same asynchronous start path.
   * @evidence contracts/common.md#authoring-interface Nested lease coordination belongs to Viewer. Terminal release passes false; resume failures remain stored and do not become an unhandled Promise rejection.
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
}
