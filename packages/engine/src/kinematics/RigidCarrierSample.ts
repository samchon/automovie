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
 * registry transports authored interval metadata and a same-time reader across the prop
 * adapter. It neither invokes unknown readers nor stores a fitted pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Holds identify the constant portions of the support and its attached material frames, in film seconds.
 * @evidence contracts/development/design.md#principled-representation An authored binding certifies one exact pair of readers for one model. A hold carries a closed-form domain predicate from that producer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the paired-reader producer and consuming prop adapter register or read this evidence.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Field equality and a stopped velocity alone confer no authority. The registry keeps no sampled output, pose, or fit.
 */
export namespace RigidCarrierSample {
  /**
   * The source clock and all parts are constant on this film interval.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives the bounds in film seconds and the source predicate that owns endpoint inclusion.
   * @evidence contracts/development/design.md#principled-representation Bounding seconds describe the interval and a source-owned predicate establishes actual membership.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two bounds and one exact predicate suffice for routing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A numeric endpoint bound alone cannot certify the state at that clock value.
   */
  export interface IHold {
    /** Lower film-clock bound, possibly negative infinity. */
    readonly from: number;
    /** Upper film-clock bound, possibly positive infinity. */
    readonly to: number;
    /**
     * Test whether the film second belongs to this stationary domain, using
     * the carrier producer's clock arithmetic for boundary inclusion.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines the timebase, Boolean result and producer-owned endpoint rule.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation The carrier producer implements the clock arithmetic.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This callable signature leaves implementation structure with the producer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The producer must prove stationary membership from its authored clock and owns the implementation evidence.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The producer's clock predicate determines the cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This callable signature implements no sharing. The producer supplies a predicate for its own stationary domain.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no resources. The producer owns any state captured by the predicate.
     */
    contains(seconds: number): boolean;
  }

  /**
   * An independently callable root and socket reader with one owned clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each world-frame reader and the film clock they share.
   * @evidence contracts/development/design.md#principled-representation The exact functions are the identity-bearing inputs to the adapter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A root reader and a socket reader are the complete pair.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Equivalent wrappers do not acquire a hold by comparing returned transforms.
   */
  export interface IBinding {
    /** Rigid carrier frame in world space. */
    readonly motion: Motion;
    /** Articulated material frame of a named carrier socket, in world space. */
    readonly point: Point;
  }

  /**
   * Same-time outputs from one actual read of an authored carrier.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the current world placement and the producer's selected material frames.
   * @evidence contracts/development/design.md#principled-representation One snapshot holds the rigid frame and the selected material observations made from that same film second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A carrier anchor and its named contacts are enough for the supported-body reader.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares canonical world transforms. The producer owns the actual material geometry and time.
   */
  export interface IRead {
    /** The carrier's actual world placement at this film second. */
    readonly frame: IAutoMovieRigidTransform;
    /**
     * A named material point in world space at the same film second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the material id, world space and already selected film second.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation The source owns the material placement law.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature routes selected ids to the source's current reader.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The implementing source guards material and its actual frame.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Per-point work belongs to the implementing source.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This method declares a same-time dependency. The source selects the shared geometry.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This portable callback signature retains nothing itself. The implementation owns the snapshot lifetime.
     */
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
   * Publish the producer's actual clock pair, its constant domains and any paired playback.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Publishes the exact pair, source-authored stationary intervals and optional playback over current film seconds.
   * @evidence contracts/development/implementation.md#principled-implementation The model and exact callbacks are the admission provenance, with membership owned by the producer's film clock.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One registration, returning the original callbacks directly.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Registration does not infer a hold from a pose or velocity and invokes no reader.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copying the finite domain list costs O(H) for H authored intervals.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every adapter of the same source pair receives the same immutable domain records.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The source root callback weakly owns its model, matching socket callback, optional evaluator and immutable domain list. No sampled result enters the registry.
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
      holds: Object.freeze(
        holds.map((hold: IHold): IHold => Object.freeze({ ...hold })),
      ),
    });
    return { motion, point };
  }

  /**
   * Transfer domains and paired playback only for the actual callback pair from the same model.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The original model and exact callbacks authorize their newly adapted prop.
   * @evidence contracts/development/implementation.md#principled-implementation The dual callback and model identity check covers both root and articulating sockets.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Lookup the source once and borrow its metadata only on an exact match.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The adapter invokes no authoring callback or hold predicate during transfer.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work with a weak lookup and identity checks.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The adapted readers borrow the original source's domain list.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The adapted prop weakly owns its matching callbacks and their domain metadata.
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
   * Read source-authored domains while the adapted prop still owns both readers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A changed callback or foreign prop falls back to ordinary reading.
   * @evidence contracts/development/implementation.md#principled-implementation The prop and both current own callback fields must match the issued adaptation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and two own field comparisons.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Descriptor reads do not execute a foreign getter or sampler.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work independent of the requested film frame count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same frozen domains are returned only for current original readers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This read registers no additional references.
   */
  export function holds(
    prop: IAutoMovieMotionHumanProp,
  ): readonly IHold[] | undefined {
    return current(prop)?.holds;
  }

  /**
   * The producer's same-time playback body, when the current prop still
   * owns its exact root and point reader pair. The caller chooses the second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the callback identity and that the returned evaluator has no supplied time yet.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same paired identity admission as the stationary domains, without requiring a stationary interval.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One guarded metadata read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Foreign and rewrapped callbacks retain their ordinary route; no source is invoked here.
   * @evidence contracts/development/implementation.md#efficient-algorithms The weak lookup and two descriptor comparisons take constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Returns the originally authored evaluator by identity while the callback pair still matches.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No sample or additional state is retained by this read.
   */
  export function playback(
    prop: IAutoMovieMotionHumanProp,
  ): IAutoMovieMotionPlayback<IRead> | undefined {
    return current(prop)?.playback;
  }

  /** The prop's still-current own callback pair, checked without calling getters. */
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
