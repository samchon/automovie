import type { IAutoMovieStageSupportWindow } from "../authoring/IAutoMovieStageSupportWindow";
import type { IAutoMovieMountBinding } from "../harness/IAutoMovieMountBinding";
import type { IAutoMovieScene } from "../scene/IAutoMovieScene";
import type { IAutoMovieConstraintViolation } from "../validation/IAutoMovieConstraintViolation";

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
 */
export type IAutoMovieStagedSet =
  | IAutoMovieStagedSet.ISuccess
  | IAutoMovieStagedSet.IFailure;

/** Data and callback contracts shared by the StagedSet operations. */
export namespace IAutoMovieStagedSet {
  /** Staging was coherent; the set is ready for blocking and performance. */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /**
     * The composed scene: actors and set pieces at rest, cameras aimed, lights
     * lowered, and the staged space, fog and environment.
     */
    scene: IAutoMovieScene;

    /** One validated persistent coupling per mounted rider, in actor order. */
    mounts: IAutoMovieStagedSet.IMount[];

    /** Actor-owned ground windows admitted against the scene space. */
    supports?: readonly {
      /** Staged actor id. */
      node: string;

      /** Windows on this shot's local clock, in authored order. */
      windows: readonly IAutoMovieStageSupportWindow[];
    }[];
  }

  /** Staging contradicted the script or itself; nothing was composed. */
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
   */
  export interface IMount {
    /** The mounted rider's scene node id. */
    node: string;

    /** The coupling it rides, the staging input's own `attach` record. */
    binding: IAutoMovieMountBinding;
  }
}
