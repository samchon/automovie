import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
} from "@automovie/interface";

/** Film-clock readers of an explicitly authored rigid carrier. */
type Motion = (seconds: number) => IAutoMovieRigidTransform;
type Point = (part: string, seconds: number) => IAutoMovieTransform;

/**
 * Identity of an owned carrier clock and its stationary intervals. This
 * registry transports only authored interval metadata across the prop
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
    /** Actual domain check using the source's numeric clock arithmetic. */
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

  /** Borrowed dispatch pair, keyed by the root reader's actual identity. */
  interface ISample {
    readonly model: object;
    readonly point: Point;
    readonly holds: readonly IHold[];
  }

  /** An adapter's actual readers, rather than the wrappers' declared types. */
  interface IAdapted {
    readonly motion: IAutoMovieMotionHumanProp["motion"];
    readonly point: IAutoMovieMotionHumanProp["point"];
    readonly holds: readonly IHold[];
  }

  /** Weak metadata is released with the reader returned by its author. */
  const authored: WeakMap<object, ISample> = new WeakMap();
  const adapted: WeakMap<IAutoMovieMotionHumanProp, IAdapted> = new WeakMap();

  /**
   * Publish the producer's actual own clock pair and constant domains.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Publishes the exact pair and its source-authored stationary intervals.
   * @evidence contracts/development/implementation.md#principled-implementation The model and exact callbacks are the admission provenance, with membership owned by the producer's film clock.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One registration, returning the original callbacks directly.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Registration does not infer a hold from a pose or velocity and invokes no reader.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copying the finite domain list costs O(H) for H authored intervals.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every adapter of the same source pair receives the same immutable domain records.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The source root callback weakly owns its model, matching socket callback and immutable domain list.
   */
  export function bind(
    model: object,
    motion: Motion,
    point: Point,
    holds: readonly IHold[],
  ): IBinding {
    authored.set(motion, {
      model,
      point,
      holds: Object.freeze(
        holds.map((hold: IHold): IHold => Object.freeze({ ...hold })),
      ),
    });
    return { motion, point };
  }

  /**
   * Transfer domains only for the actual callback pair from the same model.
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
    const binding: IAdapted | undefined = adapted.get(prop);
    return binding !== undefined &&
      Object.getOwnPropertyDescriptor(prop, "motion")?.value ===
        binding.motion &&
      Object.getOwnPropertyDescriptor(prop, "point")?.value === binding.point
      ? binding.holds
      : undefined;
  }
}
