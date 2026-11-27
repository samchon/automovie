import { AutoMovieRenderFrameGrid } from "@automovie/render";

/**
 * One film clock that several views read, so the takes of a scene shown
 * side by side stay on the same second. It advances by wall time while it
 * plays, wraps or stops at the end, and tells its listeners when anything a
 * transport shows changes.
 */
export class SceneClock {
  /** The film second. */
  public time: number = 0;

  /** Whether it advances. */
  public playing: boolean;

  /** Film seconds per wall second. */
  public speed: number = 1;

  /** Whether it starts again at the end. */
  public loop: boolean = true;

  /** The film's length, seconds; the longest take's when takes differ. */
  public duration: number = 0;

  /** Frames a second, for frame steps. */
  public fps: number = 24;

  /** The last zero-based frame number of the current presentation. */
  public get lastFrame(): number {
    return AutoMovieRenderFrameGrid.last(this.duration, this.fps);
  }

  /** The nearest regular frame while playing, or the end when reached. */
  public get frame(): number {
    return AutoMovieRenderFrameGrid.nearest(
      this.time,
      this.duration,
      this.fps,
      this.lastFrame,
    );
  }

  private last: number | null = null;
  private readonly listeners: Set<() => void> = new Set();

  /**
   * @param playing Whether it starts playing.
   */
  public constructor(playing: boolean) {
    this.playing = playing;
  }

  /**
   * Advance to a wall time.
   *
   * @param now Milliseconds, `performance.now()`.
   * @returns The film second.
   */
  public advance(now: number): number {
    // Nothing is loaded yet: no wall time is counted, so a film starts at
    // its first frame however long it took to load.
    if (this.duration === 0) {
      this.last = null;
      return this.time;
    }
    if (this.playing && this.last !== null) {
      const next: number = this.time + ((now - this.last) / 1000) * this.speed;
      const ended: boolean = !this.loop && next >= this.duration;
      this.time =
        next < this.duration
          ? next
          : this.loop
            ? next % this.duration
            : this.duration;
      if (ended) {
        this.playing = false;
        this.emit();
      }
    }
    this.last = now;
    return this.time;
  }

  /** Start or stop. */
  public toggle(): void {
    if (!this.playing && this.time >= this.duration) this.time = 0;
    this.playing = !this.playing;
    this.last = null;
    this.emit();
  }

  /**
   * Go to a second. The wall time is read afresh from the next advance, so a
   * jump never also counts the wall time spent before it.
   *
   * @param seconds The film second, clamped to the film.
   */
  public seek(seconds: number): void {
    this.time = Math.min(this.duration, Math.max(0, seconds));
    this.last = null;
    this.emit();
  }

  /**
   * Step whole frames.
   *
   * @param frames Frames forward, negative for back.
   */
  public step(frames: number): void {
    this.playing = false;
    this.seekFrame(this.frame + frames);
  }

  /**
   * Go to a frame, mapping the last frame to the presentation's exact end.
   *
   * @param frame The zero-based frame number, clamped to the presentation.
   */
  public seekFrame(frame: number): void {
    this.seek(AutoMovieRenderFrameGrid.time(frame, this.duration, this.fps));
  }

  /** Set the speed or the loop, and tell the listeners. */
  public set(change: Partial<Pick<SceneClock, "speed" | "loop">>): void {
    if (change.speed !== undefined) this.speed = change.speed;
    if (change.loop !== undefined) this.loop = change.loop;
    this.emit();
  }

  /**
   * Listen to changes a transport shows.
   *
   * @param listener Called after each change.
   * @returns What stops listening.
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return (): void => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}
