import {
  IAutoMovieConstraintViolation,
  IAutoMovieMountBinding,
  IAutoMovieScene,
} from "@automovie/interface";

/**
 * A staged film set: the composed {@link IAutoMovieScene} plus the persistent
 * mount couplings staging declared. Mounts stay alongside rather than inside
 * the scene because a scene node is a flat world placement, the per-frame world
 * transform of a mounted rider comes from `resolveAttachment` against the
 * parent's posed skeleton, not from the scene graph.
 *
 * `performShot` consumes these: every performed shot auto-descends each mount
 * into the rider's follow clip through `compileAttach` (#674), so the rider
 * rides for the whole film without re-issuing `attachTo`, the engine owns the
 * composition, the host stays a pure player.
 *
 * @author Samchon
 */
export type IAutoMovieStagedSet =
  | IAutoMovieStagedSet.ISuccess
  | IAutoMovieStagedSet.IFailure;

export namespace IAutoMovieStagedSet {
  /** Staging was coherent; the set is ready for blocking/performance. */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /** The composed scene (actors at rest, cameras aimed, lights rigged). */
    scene: IAutoMovieScene;

    /** Validated persistent couplings, one per mounted rider. */
    mounts: IMount[];
  }

  /** Staging contradicted the script or itself; nothing was composed. */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /** Every contradiction found, for the correction round. */
    violations: IAutoMovieConstraintViolation[];
  }

  /**
   * One rider→parent-bone coupling. `performShot` bakes it into the rider's
   * per-frame follow clip (#674); the host plays that clip, it does not resolve
   * the coupling itself.
   */
  export interface IMount {
    /** The mounted (riding) scene node. */
    node: string;

    /** The coupling it rides. */
    binding: IAutoMovieMountBinding;
  }
}
