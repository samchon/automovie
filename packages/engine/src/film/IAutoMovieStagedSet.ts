import {
  IAutoMovieConstraintViolation,
  IAutoMovieMountBinding,
  IAutoMovieScene,
} from "@automovie/interface";

/**
 * What `stageScene` returns: the composed {@link IAutoMovieScene} plus the
 * persistent mount couplings staging declared, or every contradiction found.
 *
 * Mounts stay beside the scene rather than inside it because a scene node is a
 * flat world placement: a mounted rider's per-frame world transform comes from
 * the parent's posed skeleton, which the scene graph does not have.
 * `performShot` bakes each mount into the rider's follow clip through
 * `compileAttach`, so the rider rides every beat without re-issuing `attachTo`
 * and the host only plays the clip.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on the literal `success`; `stageScene` collects every violation in one pass and composes a scene only when none was found, so a caller cannot reach a scene that some check rejected.
 * @evidence contracts/common.md#clear-and-simple-design Two variants with only what each outcome needs; mounts are a sibling list rather than a scene field because their transform depends on the parent's pose, which only the performance stage resolves.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Staging converts placements without judging dramatic geometry and never repairs an invalid placement, so the success variant is the authored stage lowered as written.
 * @evidence contracts/common.md#meaningful-documentation States the producer, why mounts sit beside the scene, who bakes them and what the host still does, and what each variant means.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type with no runtime body; the validation and lowering cost is answered on `stageScene`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One result per `stageScene` call; `compileDefinedShot` stages again only when a previous beat changes the stage, and nothing caches staged sets.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ownership is stated per variant; the result is released with the caller's compile.
 */
export type IAutoMovieStagedSet =
  | IAutoMovieStagedSet.ISuccess
  | IAutoMovieStagedSet.IFailure;

export namespace IAutoMovieStagedSet {
  /**
   * Staging was coherent; the set is ready for blocking and performance.
   *
   * @evidence contracts/common.md#principled-implementation Returned only when every placement, camera aim, light, space and fog check passed, with each actor's `facingDeg` turned into a rotation about `+Y` and each camera's `lookAt` into the shortest-arc rotation that aims its `-Z` at the point.
   * @evidence contracts/common.md#clear-and-simple-design The scene the renderer and later stages read, plus the mounts the scene cannot express; blocking and performance take this variant as their staged input type.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Mount bindings are carried as authored, and a mount's rig and bone preconditions are left to the performance stage, the first place with skeleton access, rather than assumed here.
   * @evidence contracts/common.md#meaningful-documentation States what success guarantees and, per field, what the scene holds and how mounts relate to riders.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; lowering is answered on `stageScene`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Produced per call and consumed by the same compile.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The scene's nodes, cameras and lights are new records, while `space`, `fog`, `environment` and each mount's `binding` are the staging input's own objects by reference, so mutating the input after staging changes the set.
   */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /**
     * The composed scene: actors and set pieces at rest, cameras aimed, lights
     * lowered, and the staged space, fog and environment.
     */
    scene: IAutoMovieScene;

    /** One validated persistent coupling per mounted rider, in actor order. */
    mounts: IMount[];
  }

  /**
   * Staging contradicted the script or itself; nothing was composed.
   *
   * @evidence contracts/common.md#principled-implementation Every finding of the single `stageScene` pass is collected through one `ViolationCollector` with its JSON path, expectation and value.
   * @evidence contracts/common.md#clear-and-simple-design Only the list, because no partial scene is safe to block or perform against.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No contradiction is auto-corrected, so the author fixes the stage instead of the engine moving or dropping a placement.
   * @evidence contracts/common.md#meaningful-documentation States that failure composes nothing and that the list is complete for the correction round.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; collecting is answered on `stageScene`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Produced per call; nothing reuses a rejected stage.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns a new array of violation records, released with the caller's result.
   */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /** Every contradiction found, in check order, for the correction round. */
    violations: IAutoMovieConstraintViolation[];
  }

  /**
   * One rider-to-parent-bone coupling. `performShot` bakes it into the rider's
   * per-frame follow clip; the host plays that clip and never resolves the
   * coupling itself. An explicit `attachTo` for the same rider in a beat
   * overrides the mount for that beat.
   *
   * @evidence contracts/common.md#principled-implementation `stageScene` emits one only for an actor with `attach`, after refusing a rider mounted on itself or on a parent that is not a placed actor; `coupleObjects` then refuses a rig-less parent or an absent bone before baking.
   * @evidence contracts/common.md#clear-and-simple-design The rider id and the binding, which is everything `compileAttach` needs besides the parent's posed skeleton that performance supplies; the same record carries the coupling into `IResolveBeatProps.mounts` for the next beat.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A mount emits no grab, attach, detach or release events, because it is standing scene state rather than a per-shot pickup, and no rider is special-cased.
   * @evidence contracts/common.md#meaningful-documentation States who bakes it, what the host does, the override rule, and per field the rider and the binding's source.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; baking is answered on `coupleObjects` and `compileAttach`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Staged once and re-baked per performed shot, because each shot's parent pose differs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the rider id and the staging input's binding by reference; the staged set's `mounts` list is its owner.
   */
  export interface IMount {
    /** The mounted rider's scene node id. */
    node: string;

    /** The coupling it rides, the staging input's own `attach` record. */
    binding: IAutoMovieMountBinding;
  }
}
