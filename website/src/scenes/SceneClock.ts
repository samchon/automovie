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
    if (this.playing && this.last !== null && this.duration > 0) {
      let next: number = this.time + ((now - this.last) / 1000) * this.speed;
      if (next >= this.duration) {
        if (this.loop) next %= this.duration;
        else {
          next = this.duration;
          this.playing = false;
          this.emit();
        }
      }
      this.time = next;
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
   * Go to a second.
   *
   * @param seconds The film second, clamped to the film.
   */
  public seek(seconds: number): void {
    this.time = Math.min(this.duration, Math.max(0, seconds));
    this.emit();
  }

  /**
   * Step whole frames.
   *
   * @param frames Frames forward, negative for back.
   */
  public step(frames: number): void {
    this.playing = false;
    this.seek(Math.round(this.time * this.fps + frames) / this.fps);
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
