import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionPlayback,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
} from "@automovie/interface";

/** Film-clock readers of an explicitly authored rigid carrier. */
type Motion = (seconds: number) => IAutoMovieRigidTransform;
type Point = (part: string, seconds: number) => IAutoMovieTransform;

/**
 * Identity of an owned carrier clock and its stationary intervals. This
 * registry transports authored interval metadata and a same-time reader across
 * the prop adapter. It neither invokes unknown readers nor stores a fitted
 * pose.
 */
export namespace RigidCarrierSample {
  /** The source clock and all parts are constant on this film interval. */
  export interface IHold {
    /** Lower film-clock bound, possibly negative infinity. */
    readonly from: number;
    /** Upper film-clock bound, possibly positive infinity. */
    readonly to: number;
    /**
     * Test whether the film second belongs to this stationary domain, using the
     * carrier producer's clock arithmetic for boundary inclusion.
     */
    contains(seconds: number): boolean;
  }

  /** An independently callable root and socket reader with one owned clock. */
  export interface IBinding {
    /** Rigid carrier frame in world space. */
    readonly motion: Motion;
    /** Articulated material frame of a named carrier socket, in world space. */
    readonly point: Point;
  }

  /** Same-time outputs from one actual read of an authored carrier. */
  export interface IRead {
    /** The carrier's actual world placement at this film second. */
    readonly frame: IAutoMovieRigidTransform;
    /** A named material point in world space at the same film second. */
    point(id: string): IAutoMovieTransform;
  }

  /** Borrowed dispatch pair, keyed by the root reader's actual identity. */
  interface ISample {
    readonly model: object;
    readonly point: Point;
    readonly holds: readonly IHold[];
    readonly playback?: IAutoMovieMotionPlayback<IRead>;
  }

  /** An adapter's actual readers, rather than the wrappers' declared types. */
  interface IAdapted {
    readonly motion: IAutoMovieMotionHumanProp["motion"];
    readonly point: IAutoMovieMotionHumanProp["point"];
    readonly holds: readonly IHold[];
    readonly playback?: IAutoMovieMotionPlayback<IRead>;
  }

  /** Weak metadata is released with the reader returned by its author. */
  const authored: WeakMap<object, ISample> = new WeakMap();
  const adapted: WeakMap<IAutoMovieMotionHumanProp, IAdapted> = new WeakMap();

  /**
   * Publish the producer's actual clock pair, its constant domains and any
   * paired playback.
   */
  export function bind(
    model: object,
    motion: Motion,
    point: Point,
    holds: readonly IHold[],
    playback?: IAutoMovieMotionPlayback<IRead>,
  ): IBinding {
    authored.set(motion, {
      model,
      point,
      playback,
      holds: holds.map((hold: IHold): IHold => ({ ...hold })),
    });
    return { motion, point };
  }

  /**
   * Transfer domains and paired playback only for the actual callback pair from
   * the same model.
   */
  export function adapt(
    prop: IAutoMovieMotionHumanProp,
    model: object,
    motion?: object,
    point?: Point,
  ): void {
    const sample: ISample | undefined =
      motion === undefined ? undefined : authored.get(motion);
    if (sample?.model === model && sample.point === point)
      adapted.set(prop, {
        motion: prop.motion,
        point: prop.point,
        holds: sample.holds,
        playback: sample.playback,
      });
  }

  /**
   * Read source-authored domains while the adapted prop still owns both
   * readers.
   */
  export function holds(
    prop: IAutoMovieMotionHumanProp,
  ): readonly IHold[] | undefined {
    return current(prop)?.holds;
  }

  /**
   * The producer's same-time playback body, when the current prop still owns
   * its exact root and point reader pair. The caller chooses the second.
   */
  export function playback(
    prop: IAutoMovieMotionHumanProp,
  ): IAutoMovieMotionPlayback<IRead> | undefined {
    return current(prop)?.playback;
  }

  /**
   * The prop's still-current own callback pair, checked without calling
   * getters.
   */
  function current(prop: IAutoMovieMotionHumanProp): IAdapted | undefined {
    const binding: IAdapted | undefined = adapted.get(prop);
    return binding !== undefined &&
      Object.getOwnPropertyDescriptor(prop, "motion")?.value ===
        binding.motion &&
      Object.getOwnPropertyDescriptor(prop, "point")?.value === binding.point
      ? binding
      : undefined;
  }
}
