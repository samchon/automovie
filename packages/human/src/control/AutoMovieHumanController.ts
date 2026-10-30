import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";

/**
 * Pure transport for caller-authored Human motions, without a renderer or pose evaluator.
 * Definitions are copied on admission; returned records are independent snapshots.
 * Absolute update clocks must be finite, nonnegative and monotonic between explicit
 * controls. Selection, playback controls, seek and reset rebase the next update.
 * Pose interpretation and interpolation belong to the caller's existing evaluator.
 *
 * @evidence contracts/common.md#principled-implementation Modulo and endpoint saturation own semantic seconds; finite clocks and definition timing are admitted before mutation, including decreasing paused clocks and overflow-safe finite advances.
 * @evidence contracts/common.md#clear-and-simple-design One private definition snapshot and one transport state serve any visual consumer without importing Three, geometry or Human generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names are caller map keys and poses remain public Human data; no catalogue, clinical validator, bone mapping or interpolation is introduced.
 * @evidence contracts/common.md#meaningful-documentation States units, clock rebasing, selected-motion requirements, input refusal, snapshot ownership and terminal diagnostic behavior.
 * @evidence contracts/performance.md#efficient-algorithms Construction copies all authored keys once; transport updates and selection use constant-time map lookups, while definition snapshots copy only the requested motion.
 * @evidence contracts/performance.md#reuse-equivalent-work Private definitions remain fixed for the controller lifetime; explicit controls change transport without rebuilding definitions or evaluating poses.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retention is bounded by the admitted caller definitions, with no independent count limit; dispose clears them and retains only final scalar diagnostics.
 */
export class AutoMovieHumanController {
  /** Private caller definitions, never returned by reference. */
  private readonly definitions: Map<
    string,
    AutoMovieHumanController.IDefinition
  >;

  /** Null denotes an unselected transport. */
  private motion: string | null = null;

  /** Selected local seconds, always inside the admitted clip interval. */
  private time: number = 0;

  /** Selected duration, retained independently for disposed diagnostics. */
  private duration: number = 0;

  /** Whether accepted update intervals advance local time. */
  private playing: boolean = false;

  /** Last accepted absolute clock, or null for the next control-origin anchor. */
  private lastClock: number | null = null;

  /** Disposal is terminal for controls and definition access. */
  private disposed: boolean = false;

  /** Copy and validate timing records; an empty map permits a static-only consumer. */
  public constructor(
    definitions: Readonly<Record<string, AutoMovieHumanController.IDefinition>>,
  ) {
    if (
      definitions === null ||
      typeof definitions !== "object" ||
      Array.isArray(definitions)
    )
      throw new Error("Human motion definitions must be a record");
    const snapshot: Record<string, AutoMovieHumanController.IDefinition> =
      structuredClone(definitions);
    for (const definition of Object.values(snapshot)) {
      if (
        definition === null ||
        typeof definition !== "object" ||
        !Number.isFinite(definition.duration) ||
        definition.duration <= 0 ||
        typeof definition.loop !== "boolean" ||
        !Array.isArray(definition.keys) ||
        definition.keys.length < 2 ||
        (definition.alignAnkles !== undefined &&
          typeof definition.alignAnkles !== "boolean")
      )
        throw new Error(
          "Human motion needs a positive duration, loop flag and at least two keys",
        );
      let previous: number = -1;
      for (const key of definition.keys) {
        if (
          key === null ||
          typeof key !== "object" ||
          !Number.isFinite(key.time) ||
          key.time < 0 ||
          key.time <= previous ||
          key.pose === null ||
          typeof key.pose !== "object" ||
          Array.isArray(key.pose)
        )
          throw new Error(
            "Human motion keys need increasing finite seconds and pose objects",
          );
        previous = key.time;
      }
      if (definition.keys[0]!.time !== 0 || previous !== definition.duration)
        throw new Error(
          "Human motion keys must start at zero and end at duration",
        );
    }
    this.definitions = new Map(Object.entries(snapshot));
  }

  /** Fresh diagnostics remain readable after disposal; mutating them changes no owner state. */
  public get state(): AutoMovieHumanController.IState {
    return {
      motion: this.motion,
      time: this.time,
      playing: this.playing,
      duration: this.duration,
      disposed: this.disposed,
    };
  }

  /** Independent map-key list; unavailable after disposal. */
  public get names(): string[] {
    this.open();
    return [...this.definitions.keys()];
  }

  /** Copy one admitted motion; unknown names and disposed access fail without mutation. */
  public definition(name: string): AutoMovieHumanController.IDefinition {
    this.open();
    return structuredClone(this.find(name));
  }

  /** Select a known motion at zero seconds without starting playback. */
  public select(name: string): void {
    this.open();
    const definition: AutoMovieHumanController.IDefinition = this.find(name);
    this.motion = name;
    this.duration = definition.duration;
    this.time = 0;
    this.playing = false;
    this.lastClock = null;
  }

  /** Start a named motion from zero, or resume the selected motion; a finished one-shot restarts. */
  public play(name?: string): void {
    this.open();
    const selected: string | null = name ?? this.motion;
    if (selected === null)
      throw new Error("Select a Human motion before playing");
    const definition: AutoMovieHumanController.IDefinition =
      this.find(selected);
    const restart: boolean =
      name !== undefined ||
      (!definition.loop && this.time >= definition.duration);
    this.motion = selected;
    this.duration = definition.duration;
    if (restart) this.time = 0;
    this.playing = true;
    this.lastClock = null;
  }

  /** Stop advancing time and rebase the next absolute sample. */
  public pause(): void {
    this.open();
    this.playing = false;
    this.lastClock = null;
  }

  /** Seek local seconds; loops wrap, one-shots saturate and stop at their endpoint. */
  public seek(seconds: number): void {
    this.open();
    this.seconds(seconds);
    if (this.motion === null)
      throw new Error("Select a Human motion before seeking");
    const definition: AutoMovieHumanController.IDefinition = this.find(
      this.motion,
    );
    const time: number = definition.loop
      ? seconds % this.duration
      : Math.min(seconds, this.duration);
    this.time = time;
    if (!definition.loop && time === this.duration) this.playing = false;
    this.lastClock = null;
  }

  /** Advance from monotonic absolute seconds; the first accepted sample only anchors the clock. */
  public update(absoluteSeconds: number): void {
    this.open();
    this.seconds(absoluteSeconds);
    if (this.lastClock !== null && absoluteSeconds < this.lastClock)
      throw new Error(
        "Human update clock must not decrease; use seek for local rewinding",
      );
    const delta: number =
      this.lastClock === null ? 0 : absoluteSeconds - this.lastClock;
    let time: number = this.time;
    let playing: boolean = this.playing;
    if (playing && this.motion !== null) {
      const definition: AutoMovieHumanController.IDefinition = this.find(
        this.motion,
      );

      // Reduce the advance before adding phase: two finite values can otherwise overflow.
      const remaining: number = this.duration - time;
      if (definition.loop) {
        const step: number = delta % this.duration;
        time =
          (step >= remaining ? step - remaining : time + step) % this.duration;
      } else if (delta >= remaining) {
        time = this.duration;
        playing = false;
      } else time += delta;
    }
    this.time = time;
    this.playing = playing;
    this.lastClock = absoluteSeconds;
  }

  /** Deselect motion and restore an idle zero-second transport. */
  public reset(): void {
    this.open();
    this.motion = null;
    this.duration = 0;
    this.time = 0;
    this.playing = false;
    this.lastClock = null;
  }

  /** Clear owned definitions once while preserving final scalar diagnostics. */
  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.playing = false;
    this.lastClock = null;
    this.definitions.clear();
  }

  /** Resolve only this owner's admitted map key. */
  private find(name: string): AutoMovieHumanController.IDefinition {
    const definition: AutoMovieHumanController.IDefinition | undefined =
      this.definitions.get(name);
    if (definition === undefined)
      throw new Error(`Unknown Human motion: ${name}`);
    return definition;
  }

  /** Reject invalid seconds before any clock or transport write. */
  private seconds(value: number): void {
    if (!Number.isFinite(value) || value < 0)
      throw new Error("Human time requires finite nonnegative seconds");
  }

  /** A disposed owner admits only diagnostics and repeated disposal. */
  private open(): void {
    if (this.disposed) throw new Error("Human controller is disposed");
  }
}

/** Public caller data and scalar diagnostics for the pure transport. */
export namespace AutoMovieHumanController {
  /** One public pose at local seconds; clinical interpretation remains evaluator-owned. */
  export interface IKey {
    /** Finite nonnegative seconds, strictly increasing within a definition. */
    time: number;

    /** Public pose object; this transport does not validate clinical ranges. */
    pose: IAutoMovieHumanPose;
  }

  /** Caller-authored timing and poses, copied privately by construction. */
  export interface IDefinition {
    /** Finite positive duration in seconds. */
    duration: number;

    /** Wrap local time instead of stopping at duration. */
    loop: boolean;

    /** At least two keys, beginning at zero and ending exactly at duration. */
    keys: readonly IKey[];

    /** Optional viewer convention aligning ankle-centre height at authored keys, without a contact solver. */
    alignAnkles?: boolean;
  }

  /** Fresh scalar snapshot, including final diagnostics after disposal. */
  export interface IState {
    /** Null denotes no selected motion. */
    motion: string | null;

    /** Current local seconds. */
    time: number;

    /** Whether accepted clock intervals advance local time. */
    playing: boolean;

    /** Selected duration in seconds, or zero before selection/reset. */
    duration: number;

    /** Terminal admission state; repeated dispose is harmless. */
    disposed: boolean;
  }
}
