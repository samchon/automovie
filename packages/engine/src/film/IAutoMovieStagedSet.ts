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
 * @evidence contracts/development/design.md#principled-representation A discriminated union on the literal `success`; `stageScene` collects every violation in one pass and composes a scene only when none was found, so a caller cannot reach a scene that some check rejected.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two variants with only what each outcome needs; mounts are a sibling list rather than a scene field because their transform depends on the parent's pose, which only the performance stage resolves.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Staging converts placements without judging dramatic geometry and never repairs an invalid placement, so the success variant is the authored stage lowered as written.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, why mounts sit beside the scene, who bakes them and what the host still does, and what each variant means.
 */
export type IAutoMovieStagedSet =
  | IAutoMovieStagedSet.ISuccess
  | IAutoMovieStagedSet.IFailure;

export namespace IAutoMovieStagedSet {
  /**
   * Staging was coherent; the set is ready for blocking and performance.
   *
   * @evidence contracts/development/design.md#principled-representation Returned only when every placement, camera aim, light, space and fog check passed, with each actor's `facingDeg` turned into a rotation about `+Y` and each camera's `lookAt` into the shortest-arc rotation that aims its `-Z` at the point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The scene the renderer and later stages read, plus the mounts the scene cannot express; blocking and performance take this variant as their staged input type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Mount bindings are carried as authored, and a mount's rig and bone preconditions are left to the performance stage, the first place with skeleton access, rather than assumed here.
   * @evidence contracts/development/common.md#meaningful-documentation States what success guarantees and, per field, what the scene holds and how mounts relate to riders.
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
   * @evidence contracts/development/design.md#principled-representation Every finding of the single `stageScene` pass is collected through one `ViolationCollector` with its JSON path, expectation and value.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the list, because no partial scene is safe to block or perform against.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No contradiction is auto-corrected, so the author fixes the stage instead of the engine moving or dropping a placement.
   * @evidence contracts/development/common.md#meaningful-documentation States that failure composes nothing and that the list is complete for the correction round.
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
   * @evidence contracts/development/design.md#principled-representation `stageScene` emits one only for an actor with `attach`, after refusing a rider mounted on itself or on a parent that is not a placed actor; `coupleObjects` then refuses a rig-less parent or an absent bone before baking.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The rider id and the binding, which is everything `compileAttach` needs besides the parent's posed skeleton that performance supplies; the same record carries the coupling into `IResolveBeatProps.mounts` for the next beat.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A mount emits no grab, attach, detach or release events, because it is standing scene state rather than a per-shot pickup, and no rider is special-cased.
   * @evidence contracts/development/common.md#meaningful-documentation States who bakes it, what the host does, the override rule, and per field the rider and the binding's source.
   */
  export interface IMount {
    /** The mounted rider's scene node id. */
    node: string;

    /** The coupling it rides, the staging input's own `attach` record. */
    binding: IAutoMovieMountBinding;
  }
}
